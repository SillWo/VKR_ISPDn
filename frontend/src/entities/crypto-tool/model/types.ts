export type CryptoToolClass = "KS1" | "KS2" | "KS3" | "KV" | "KA";

export type CryptoTool = {
  id: number;
  name: string;
  cryptoClass: CryptoToolClass;
  manufacturer: string;
  serialNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type CryptoToolListItem = CryptoTool;

export type CryptoToolOption = {
  id: number;
  name: string;
  cryptoClass: CryptoToolClass;
  manufacturer: string;
  serialNumber: string;
};

export type CryptoToolFormValues = {
  name: string;
  cryptoClass: CryptoToolClass | "";
  manufacturer: string;
  serialNumber: string;
};

export type IspdnCryptography = {
  ispdnId: number;
  usesCryptography: boolean;
  cryptoTools: CryptoToolOption[];
};

export type IspdnCryptographyUpdate = {
  usesCryptography: boolean;
  cryptoToolIds: number[];
};
