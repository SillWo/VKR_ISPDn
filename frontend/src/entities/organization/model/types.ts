export type OrganizationCard = {
  id: number;
  shortLegalName: string;
  fullLegalName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  headFullName: string;
  headPosition: string;
  registrationAddress: string;
  registrationCity: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationFormValues = {
  shortLegalName: string;
  fullLegalName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  headFullName: string;
  headPosition: string;
  registrationAddress: string;
  registrationCity: string;
};
