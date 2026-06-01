import { IRole } from "./systemSettings";

export interface IUserAuth {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  hasAccess: boolean;
  isActive: boolean;
  profileImage?: string;
  updatedAt: string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  token: {
    accessToken: string;
    refreshToken: string;
  };
  role: IRole;
}
