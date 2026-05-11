import { httpClient } from "../../../shared/api/httpClient";
import type {
  CryptoTool,
  CryptoToolClass,
  CryptoToolFormValues,
  CryptoToolListItem,
  CryptoToolOption,
  IspdnCryptography,
  IspdnCryptographyUpdate,
} from "../model/types";

type CryptoToolDto = {
  id: number;
  name: string;
  crypto_class: CryptoToolClass;
  manufacturer: string;
  serial_number: string;
  created_at: string;
  updated_at: string;
};

type CryptoToolOptionDto = {
  id: number;
  name: string;
  crypto_class: CryptoToolClass;
  manufacturer: string;
  serial_number: string;
};

type CryptoToolPayloadDto = {
  name: string;
  crypto_class: CryptoToolClass;
  manufacturer: string;
  serial_number: string;
};

type IspdnCryptographyDto = {
  ispdn_id: number;
  uses_cryptography: boolean;
  crypto_tools: CryptoToolOptionDto[];
};

function mapCryptoTool(dto: CryptoToolDto): CryptoTool {
  return {
    id: dto.id,
    name: dto.name,
    cryptoClass: dto.crypto_class,
    manufacturer: dto.manufacturer,
    serialNumber: dto.serial_number,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapOption(dto: CryptoToolOptionDto): CryptoToolOption {
  return {
    id: dto.id,
    name: dto.name,
    cryptoClass: dto.crypto_class,
    manufacturer: dto.manufacturer,
    serialNumber: dto.serial_number,
  };
}

function mapCryptography(dto: IspdnCryptographyDto): IspdnCryptography {
  return {
    ispdnId: dto.ispdn_id,
    usesCryptography: dto.uses_cryptography,
    cryptoTools: dto.crypto_tools.map(mapOption),
  };
}

function mapPayload(values: CryptoToolFormValues): CryptoToolPayloadDto {
  return {
    name: values.name.trim(),
    crypto_class: values.cryptoClass as CryptoToolClass,
    manufacturer: values.manufacturer.trim(),
    serial_number: values.serialNumber.trim(),
  };
}

export function toCryptoToolFormValues(cryptoTool: CryptoTool): CryptoToolFormValues {
  return {
    name: cryptoTool.name,
    cryptoClass: cryptoTool.cryptoClass,
    manufacturer: cryptoTool.manufacturer,
    serialNumber: cryptoTool.serialNumber,
  };
}

export function getCryptoTools() {
  return httpClient<CryptoToolDto[]>("/api/v1/crypto-tools").then((items) => items.map(mapCryptoTool));
}

export function getCryptoToolOptions() {
  return httpClient<CryptoToolOptionDto[]>("/api/v1/crypto-tools/options").then((items) => items.map(mapOption));
}

export function getCryptoToolById(cryptoToolId: number) {
  return httpClient<CryptoToolDto>(`/api/v1/crypto-tools/${cryptoToolId}`).then(mapCryptoTool);
}

export function createCryptoTool(payload: CryptoToolFormValues) {
  return httpClient<CryptoToolDto>("/api/v1/crypto-tools", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapCryptoTool);
}

export function updateCryptoTool(cryptoToolId: number, payload: CryptoToolFormValues) {
  return httpClient<CryptoToolDto>(`/api/v1/crypto-tools/${cryptoToolId}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapCryptoTool);
}

export function deleteCryptoTool(cryptoToolId: number) {
  return httpClient<void>(`/api/v1/crypto-tools/${cryptoToolId}`, { method: "DELETE" });
}

export function getIspdnCryptography(ispdnId: number) {
  return httpClient<IspdnCryptographyDto>(`/api/v1/ispdns/${ispdnId}/cryptography`).then(mapCryptography);
}

export function updateIspdnCryptography(ispdnId: number, payload: IspdnCryptographyUpdate) {
  return httpClient<IspdnCryptographyDto>(`/api/v1/ispdns/${ispdnId}/cryptography`, {
    method: "PUT",
    body: JSON.stringify({
      uses_cryptography: payload.usesCryptography,
      crypto_tool_ids: payload.cryptoToolIds,
    }),
  }).then(mapCryptography);
}

export function toCryptoToolOption(cryptoTool: CryptoToolListItem): CryptoToolOption {
  return {
    id: cryptoTool.id,
    name: cryptoTool.name,
    cryptoClass: cryptoTool.cryptoClass,
    manufacturer: cryptoTool.manufacturer,
    serialNumber: cryptoTool.serialNumber,
  };
}
