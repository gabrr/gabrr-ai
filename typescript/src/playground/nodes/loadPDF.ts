import fs from "fs/promises";
import path from "path";
import PDFParser from "pdf2json";

import { IAgentContext } from "@/agent";
import { BaseNode, NodeResult } from "@/nodes";

const DEFAULT_CHUNK_SIZE = 100;

function chunkText(text: string, maxChunkSize: number): string[] {
  if (!text) return [];
  const size =
    Number.isFinite(maxChunkSize) && maxChunkSize > 0
      ? maxChunkSize
      : DEFAULT_CHUNK_SIZE;

  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
    const next = current ? `${current} ${word}` : word;
    if (next.length > size) {
      if (current) {
        chunks.push(current);
      }
      if (word.length > size) {
        // Word itself is longer than the chunk size; push it as-is to avoid endless loop
        chunks.push(word);
        current = "";
      } else {
        current = word;
      }
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

class LoadPDF extends BaseNode {
  id = "loadPDF";

  async run(ctx: IAgentContext): Promise<NodeResult> {
    const requestedFilename =
      ctx.user?.request || (this._options.filename as string) || "filename.pdf";
    const requestedChunkSize = this._options.chunkSize as number;
    const chunkSize =
      Number.isFinite(requestedChunkSize) && requestedChunkSize > 0
        ? requestedChunkSize
        : DEFAULT_CHUNK_SIZE;
    const filename = path.basename(requestedFilename);
    const filePath = path.join(process.cwd(), "uploads", filename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const text = await this.parsePdfText(fileBuffer);
      const chunks = chunkText(text, chunkSize);

      return {
        nodeId: this.id,
        value: {
          filename,
          chunks: chunks[38],
          chunkSize,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load PDF "${filename}": ${message}`);
    }
  }

  private parsePdfText(fileBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const parser = new PDFParser(undefined, true);

      const onError = (err: { parserError?: Error } | Error) => {
        parser.removeAllListeners();
        parser.destroy();
        const error = err instanceof Error ? err : err?.parserError;
        reject(error ?? new Error("Unknown PDF parse error"));
      };

      const onReady = () => {
        try {
          const rawText = parser.getRawTextContent() || "";
          resolve(rawText.trim());
        } catch (error) {
          reject(error);
        } finally {
          parser.removeAllListeners();
          parser.destroy();
        }
      };

      parser.on("pdfParser_dataError", onError);
      parser.on("pdfParser_dataReady", onReady);

      try {
        parser.parseBuffer(fileBuffer);
      } catch (error) {
        onError(error as Error);
      }
    });
  }
}

export default new LoadPDF();
