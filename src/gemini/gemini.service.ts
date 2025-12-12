/* eslint-disable @typescript-eslint/no-unsafe-return */
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private visionModel: GenerativeModel;
  private searchModel: GenerativeModel;
  private readonly MODEL_NAME = 'gemini-2.5-flash';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey!);
    this.visionModel = this.genAI.getGenerativeModel({
      model: this.MODEL_NAME,
    });
    this.searchModel = this.genAI.getGenerativeModel({
      model: this.MODEL_NAME,
      tools: [{ googleSearch: {} } as any],
    });
  }

  /**
   * First step: Visual identification
   */
  async identifyGame(imageBuffer: Buffer, mimeType: string) {
    try {
      const prompt = `
        Actúa como un experto en catalogación de videojuegos retro. Analiza esta imagen.
        Tu objetivo es extraer datos para rellenar un formulario de tasación.
        Fíjate en detalles: Logos (ESRB, PEGI), códigos (SLES), estado físico.

        Instrucciones para múltiples juegos:
        - Si detectas VARIOS juegos, marca "multiple_detected": true.
        - Rellena "candidates" con una lista de OBJETOS para cada juego visible.
        - Cada candidato debe incluir su propio Título, Plataforma y Condición estimada.

        Devuelve SOLO un objeto JSON con esta estructura:
        {
            "found": boolean,
            "multiple_detected": boolean,
            "candidates": [
                {
                    "title": "Nombre del Juego A",
                    "platform": "Plataforma A",
                    "condition_guess": "LOOSE" | "CIB" | "SEALED"
                },
                ...
            ],
            "data": {
                "title": "Nombre exacto (del juego más prominente)",
                "platform": "Consola",
                "region_guess": "PAL ESP" | "PAL EUR" | "NTSC U" | "NTSC J" | "UNKNOWN",
                "condition_guess": "LOOSE" | "CIB" | "SEALED",
                "confidence_notes": "Breve justificación"
            }
        }
        `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      };

      const result = await this.visionModel.generateContent({
        contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = result.response;
      return this.cleanJson(response.text());
    } catch (error) {
      console.error('Error in Gemini Identify:', error);
      throw new InternalServerErrorException(
        'Failed to identify game from image.',
      );
    }
  }

  /**
   * Second step: Price search with Search Grounding
   */
  async appraiseGame(data: {
    title: string;
    platform: string;
    region: string;
    condition: string;
  }) {
    try {
      const prompt = `
        Busca el precio de mercado REAL para un comprador experto:
        Juego: "${data.title}"
        Plataforma: "${data.platform}"
        Región: "${data.region}" (CRÍTICO: Diferencia estricta entre regiones PAL/NTSC)
        Condición Buscada: "${data.condition}"

        Instrucciones de Búsqueda HÍBRIDA (VENDIDOS + ACTIVOS):
        1. PRIORIDAD TOTAL: Busca "eBay Sold Listings" (Ventas Finalizadas). Esto es el valor real.
        2. SOPORTE SECUNDARIO: Busca también "Active Listings" (Anuncios activos/Buy It Now) para tener contexto de oferta actual.
           - Útil si hay pocas ventas recientes.
           - IMPORTANTE: En anuncios activos, fíjate solo en los PRECIOS MÁS BAJOS. Ignora los caros que llevan meses sin venderse.
        
        Instrucciones de Cálculo (LÓGICA DE MODA):
        1. AGRUPACIÓN (CLUSTER DOMINANTE):
           - Agrupa los precios encontrados (priorizando vendidos) en rangos de densidad.
           - Si tienes ventas confirmadas, úsalas como base principal.
           - Si NO hay ventas, usa los anuncios activos MÁS BARATOS como referencia, pero aplica un descuento del 10-15% (margen de negociación habitual).
           - IGNORA outliers (precintados si buscas CIB, o precios de especulación absurdos).
        
        2. CÁLCULO FINAL:
           - "price_median": El valor más representativo del cluster dominante.
           - "price_low": El mínimo razonable encontrado.
           - "price_high": El máximo razonable del grupo principal.

        Devuelve SOLO un JSON válido:
        {
            "currency": "EUR",
            "price_low": number,
            "price_high": number,
            "price_median": number,
            "trend": "stable" | "going_up" | "going_down",
            "source_data": {
                "name": "eBay (Sold + Active)",
                "items_analyzed": number
            },
            "explanation": "Explica si usaste ventas o activos. Ej: 'Pocas ventas recientes. Basado en los 3 anuncios activos más baratos (aprox 90€)'."
        }
        `;

      const result = await this.searchModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const response = result.response;
      return this.cleanJson(response.text());
    } catch (error) {
      console.error('Error in Gemini Appraise:', error);
      throw new InternalServerErrorException('Failed to appraise game.');
    }
  }

  private cleanJson(text: string) {
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      console.error('Fallo al parsear respuesta de Gemini:', text);
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch {
          throw new InternalServerErrorException(
            'La IA no devolvió un JSON válido incluso tras limpieza.',
          );
        }
      }
      throw new InternalServerErrorException(
        'La IA no devolvió un JSON válido',
      );
    }
  }
}
