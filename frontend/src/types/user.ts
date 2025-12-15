export type TRole = "admin" | "vendor" | "buyer";


export interface IUser {
    country?: string | null | undefined;
    postalCode?: string | null | undefined;
    state?: string | null | undefined;
    city?: string | null | undefined;
    addressLine2?: string | null | undefined;
    addressLine1?: string | null | undefined;
    profileImage?: string | null | undefined;
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