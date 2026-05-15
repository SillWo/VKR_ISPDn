import { authHeaders, buildApiUrl, httpClient, HttpError } from "../../../shared/api/httpClient";
import type {
  DocumentType,
  GenerateGlobalDocumentPayload,
  GenerateIspdnDocumentPayload,
  GeneratedDocumentFile,
} from "../model/types";

type DocumentManualFieldDto = {
  name: string;
  label: string;
  type: "text" | "textarea" | "array";
  required: boolean;
  items?: DocumentManualFieldDto[];
};

type DocumentTypeDto = {
  code: string;
  title: string;
  description: string;
  requires_ispdn: boolean;
  manual_fields: DocumentManualFieldDto[];
};

function mapDocumentType(dto: DocumentTypeDto): DocumentType {
  return {
    code: dto.code,
    title: dto.title,
    description: dto.description,
    requiresIspdn: dto.requires_ispdn,
    manualFields: dto.manual_fields.map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      items: field.items,
    })),
  };
}

function getFilenameFromContentDisposition(contentDisposition: string | null) {
  if (!contentDisposition) {
    return "document.docx";
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? "document.docx";
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    return response.statusText;
  }
  return response.statusText;
}

export function getDocumentTypes() {
  return httpClient<DocumentTypeDto[]>("/api/v1/document-types").then((items) => items.map(mapDocumentType));
}

export async function generateIspdnDocument(
  ispdnId: number,
  payload: GenerateIspdnDocumentPayload,
): Promise<GeneratedDocumentFile> {
  const response = await fetch(buildApiUrl(`/api/v1/ispdns/${ispdnId}/documents/generate`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      document_type: payload.documentType,
      manual_data: payload.manualData,
    }),
  });

  if (!response.ok) {
    throw new HttpError(response.status, await getErrorMessage(response));
  }

  const blob = await response.blob();
  return {
    blob,
    filename: getFilenameFromContentDisposition(response.headers.get("Content-Disposition")),
  };
}

export async function generateGlobalDocument(
  payload: GenerateGlobalDocumentPayload,
): Promise<GeneratedDocumentFile> {
  const response = await fetch(buildApiUrl("/api/v1/documents/generate"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      document_type: payload.documentType,
      manual_data: payload.manualData,
    }),
  });

  if (!response.ok) {
    throw new HttpError(response.status, await getErrorMessage(response));
  }

  const blob = await response.blob();
  return {
    blob,
    filename: getFilenameFromContentDisposition(response.headers.get("Content-Disposition")),
  };
}
