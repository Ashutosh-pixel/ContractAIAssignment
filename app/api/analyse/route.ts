import { JSON_SCHEMA_RESPONSE, SYSTEM_PROMPT } from "@/lib/prompts";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const parser = new PDFParser(null, true);
        parser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        parser.on("pdfParser_dataReady", () => {
            const rawText = parser.getRawTextContent();
            resolve(rawText);
        });
        parser.parseBuffer(buffer);
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text using pdf2json
        const extractedText = (await extractTextFromPDF(buffer)).trim();

        if (isScannedDocument(extractedText)) {
            return NextResponse.json({
                success: false,
                code: "SCANNED_DOCUMENT",
                message: "This PDF appears to be a scanned document. Scanned documents are not supported yet."
            });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Document Name: ${file.name}\n\nDocument Text:\n${extractedText}`
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: JSON_SCHEMA_RESPONSE
            },
            model: "openai/gpt-oss-120b",
            temperature: 0.0,
            max_completion_tokens: 8000,
            reasoning_effort: "medium",
        });

        const parsedResult = JSON.parse(chatCompletion.choices[0].message.content || "{}");
        return NextResponse.json(parsedResult);
    } catch (error: any) {
        console.error("Analysis Error:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze contract" }, { status: 500 });
    }
}

function isScannedDocument(text: string): boolean {
    const normalized = text
        .replace(/\s+/g, " ")
        .trim();

    if (normalized.length < 50) {
        return true;
    }

    // Count actual alphanumeric characters
    const alphanumeric = normalized.match(/[a-zA-Z0-9]/g)?.length ?? 0;

    // If almost no meaningful characters were extracted
    if (alphanumeric < 30) {
        return true;
    }

    return false;
}