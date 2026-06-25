const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`;

  // const response = await ai.models.generateContent({
  //     model: "gemini-2.5-flash",
  //     contents: prompt,
  //     config: {
  //         responseMimeType: "application/json",
  //         responseSchema: zodToJsonSchema(interviewReportSchema),
  //     }
  // })

  let response;

  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      },
    });
  } catch (error) {
    console.log("Primary model failed, trying fallback...");

    response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      },
    });
  }

  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  // console.log("Executable path:", puppeteer.executablePath());

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true,
  });
  // const browser = await puppeteer.launch()
  console.log("Chromium object:", chromium);
console.log("ExecutablePath type:", typeof chromium.executablePath);
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

// async function generateResumePdf({ resume, selfDescription, jobDescription }) {

//     const resumePdfSchema = z.object({
//         html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
//     })

//     const prompt = `Generate resume for a candidate with the following details:
//                         Resume: ${resume}
//                         Self Description: ${selfDescription}
//                         Job Description: ${jobDescription}

//                         the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
//                         The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
//                         The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
//                         you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
//                         The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
//                         The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
//                     `

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: prompt,
//         config: {
//             responseMimeType: "application/json",
//             responseSchema: zodToJsonSchema(resumePdfSchema),
//         }
//     })

//     const jsonContent = JSON.parse(response.text)

//     const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

//     return pdfBuffer

// }

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `Generate a resume for a candidate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}

        The response should be a JSON object with a single field "html" which contains the HTML+CSS content of the resume that can be converted to PDF using puppeteer.

        RESUME STRUCTURE (strictly follow this order):
        1. Header — Full name (large, bold, centered), with icons before each contact item:
           - Phone icon + phone number
           - Email icon + email address
           - LinkedIn icon + LinkedIn URL
           - GitHub icon + GitHub URL
           Use Font Awesome icons via CDN: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css

        2. Introduction — A 3-4 line professional summary tailored specifically to the job description.

        3. Technical Skills — Grouped by category (Languages, Front-End, Back-End, Full-Stack, Database, Tools). Only include skills relevant to the job.

        4. Projects — Include only the 2-3 most relevant projects for the job. Each must have:
           - Project name (bold) | Tech stack | GitHub/Live Link
           - 3-5 bullet points with strong action verbs and quantified results where possible.

        5. Certifications — Only include certifications relevant to the job:
           - Certificate name | Issuing organization | Year

        6. Education — Each entry must include:
           - Institution name and location
           - Degree and year range
           - CGPI/Grade if available

        DESIGN RULES:
        - All text must be strictly BLACK — #000000. No colored text anywhere.
        - Icons must be black using Font Awesome (fas fa-phone, fas fa-envelope, fab fa-linkedin, fab fa-github).
        - Section headings: bold, uppercase, with a full-width black bottom border/line beneath them.
        - Font: use 'Lato' from Google Fonts (https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap)
        - Font size: 11px body, 22px name, 13px section headings.
        - Page width: 794px (A4), padding: 40px on all sides.
        - Section divider: a solid 1.5px black horizontal line under each section title.
        - Bullet points: use a small solid black circle (•), no extra colors.
        - Links: black, no underline, no blue color.
        - Background: white (#ffffff).
        - Keep the layout single-column, clean, and minimal — no boxes, no sidebars, no colored blocks.

        TAILORING RULES:
        - Read the job description carefully and identify the top 5-7 required skills and keywords.
        - Mirror those exact keywords naturally in the Introduction, Skills, and Project bullets.
        - Rewrite project bullet points to emphasize outcomes and technologies matching the job.
        - Remove or skip any experience or skills not relevant to the job description.
        - Use strong action verbs: Developed, Engineered, Designed, Implemented, Optimized, Integrated, Built.
        - Quantify achievements wherever possible (e.g. "reduced load time by 40%", "supports 1000+ concurrent users").
        - The introduction must sound natural and human-written — not like a generic AI-generated paragraph.
        - Keep the resume to 1 page maximum. Be concise and prioritize quality over quantity.

        OUTPUT RULES:
        - The HTML must be a complete document including <html>, <head>, <style>, and <body> tags.
        - Inline the Font Awesome CDN and Google Fonts link inside <head>.
        - All CSS must be inside a <style> tag in the <head>.
        - Do not include any explanation or text outside the JSON object.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
