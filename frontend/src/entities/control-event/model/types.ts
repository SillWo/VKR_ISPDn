export type ControlEventFile = {
  id: number;
  controlEventId: number;
  fileName: string;
  fileContentType: string;
  fileSizeBytes: number;
  createdAt: string;
};

export type ControlEvent = {
  id: number;
  name: string;
  description: string;
  files: ControlEventFile[];
  createdAt: string;
  updatedAt: string;
};

export type ControlEventFormValues = {
  name: string;
  description: string;
};

export type ControlEventOption = {
  id: number;
  name: string;
  description: string;
};
