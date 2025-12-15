import { getProfile } from "@/services/userService";
import { setUser } from "@/services/authService";

export async function bootstrapAuth() {
  try {
    const res = await getProfile();
    if (res?.data) {
      setUser({
        ...res.data,
        phoneNumber: res.data.phoneNumber ?? "",
      });
    }
  } catch {
    // silently fail – user not logged in
  }
}
