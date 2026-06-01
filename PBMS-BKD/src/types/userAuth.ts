export interface IPermission {
  id: number;
  name: string;
  value: string;
  module: string;
}

export interface IUserAuth {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  tel: string;
  salary: any;
  password: string;
  pin: string | null;
  hasAccess: boolean;
  hasPrescriptionAccess: boolean;
  isActive: boolean;
  profileImage: string | null;
  updatedAt: Date;
  createdAt: Date;
  branch: {
    id: number;
    name: string;
  } | null;
  dept: {
    id: number;
    name: string;
  } | null;
  role: {
    id: number;
    name: string;
    permissions: IPermission[];
  } | null;
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

export class RefreshTokenDto {
  // This will be handled via cookies, so no body needed
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export type IUserAuthWithoutPassword = Omit<IUserAuth, 'password'>;
export type IUserAuthWithoutToken = Omit<IUserAuth, 'token'>;
