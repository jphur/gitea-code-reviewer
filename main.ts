import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';

// Definimos una interfaz sencilla para el resultado
interface ReviewResult {
  content: string;
  status: 'success' | 'error';
}

const diffContent: string = fs.readFileSync('pr.diff', 'utf8');

async function runReview(): Promise<void> {
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash-lite'),
      system: `Eres un Senior Software Engineer. Revisas codigo css y html. Analiza el siguiente diff de un PR y responde con un resumen de los cambios, posibles problemas, mejoras y una calificación general del código (1-10).
               ${diffContent}`,
    });

    fs.writeFileSync('review_result.txt', text);
    console.log("Análisis de TS finalizado con éxito.");
  } catch (err: any) {
    console.error("Error en el análisis:", err);
  }
}

runReview();