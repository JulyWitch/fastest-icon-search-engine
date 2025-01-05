export interface IconSource {
  path: string;
  prefix: string;
  postfix?: string;
  keywords: string[];
}

export interface IconPackLicense {
  type: string;
  url: string;
}

export interface IconPack {
  name: string;
  repository: string;
  license: IconPackLicense;
  sources: IconSource[];
}
