export type TRole = "admin" | "vendor" | "buyer";


export interface IUser {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: TRole;
    createdAt?: string;
    updatedAt?: string;
}


// Responses
export type SignupResponseData = {
    message: string;
    user: IUser;
};


export type LoginResponseData = {
  user: IUser;
  accessToken: string;
  refreshToken?: string; // still optional if sometimes omitted
  sessionId?: string;    // NEW – returned by backend
};