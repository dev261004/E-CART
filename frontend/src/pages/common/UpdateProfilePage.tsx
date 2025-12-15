/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
    updateProfileSchema,
    type UpdateProfileFormInput,
} from "@/validation/updateProfileSchema";

import type { ApiResult } from "@/types/api";
import type { UpdateProfileResult } from "@/types/profile";
import * as userService from "@/services/userService";
import { getUser, setUser } from "@/services/authService";
import { useServerErrors } from "@/hooks/useServerErrors";
import LoadingPage from "@/components/LoadingPage";
import toast from "react-hot-toast";
import { Camera, MapPin, Phone, User2, ShieldCheck, X } from "lucide-react";

export default function UpdateProfilePage(): JSX.Element {
    const navigate = useNavigate();
    const authUser = getUser();

    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<UpdateProfileFormInput>({
        name: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);

    const {
        errors,
        globalError,
        setErrorsObject,
        clearErrors,
        handleServerError,
    } = useServerErrors();

    useEffect(() => {
        const user = getUser();
        if (!user) {
            navigate("/login");
            return;
        }

        const loadProfile = async () => {
            try {
                const res: ApiResult<UpdateProfileResult> =
                    await userService.getProfile();

                if (res.error) {
                    handleServerError(res.error);
                    return;
                }

                const data = res.data;
                if (data) {
                    setForm({
                        name: data.name ?? "",
                        phoneNumber: data.phoneNumber ?? "",
                        addressLine1: data.addressLine1 ?? "",
                        addressLine2: data.addressLine2 ?? "",
                        city: data.city ?? "",
                        state: data.state ?? "",
                        postalCode: data.postalCode ?? "",
                        country: data.country ?? "",
                    });
                    setAvatarPreview(data.profileImage ?? null);
                    setAvatarRemoved(false);
                }
            } catch (err: any) {
                handleServerError(err);
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    if (!authUser) {
        return <LoadingPage message="Checking authentication..." fullScreen />;
    }

    if (initialLoading) {
        return <LoadingPage message="Loading profile..." fullScreen />;
    }

    // 🔹 helper: recompute validation errors for a single field (live)
    const validateFieldLive = (
        nextForm: UpdateProfileFormInput,
        fieldName: keyof UpdateProfileFormInput
    ) => {
        // validate only this field using the main schema
        const parsed = updateProfileSchema.safeParse(nextForm);

        if (!parsed.success) {
            // find first issue for this field
            const issueForField = parsed.error.issues.find(
                (iss) => iss.path?.[0] === fieldName
            );
            const fieldError = issueForField ? issueForField.message : "";

            setErrorsObject({
                ...errors,
                [fieldName]: fieldError,
                global: "", // clear global while typing
            });
        } else {
            // whole form is valid → clear this field error and global
            setErrorsObject({
                ...errors,
                [fieldName]: "",
                global: "",
            });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        let nextValue = value;

        // sanitise based on field
        if (name === "phoneNumber") {
            // digits only, max 10
            nextValue = value.replace(/\D/g, "").slice(0, 10);
        } else if (name === "postalCode") {
            // digits only, max 6
            nextValue = value.replace(/\D/g, "").slice(0, 6);
        } else if (
            name === "name" ||
            name === "city" ||
            name === "state" ||
            name === "country"
        ) {
            // only letters + spaces
            nextValue = value.replace(/[^A-Za-z\s]/g, "");

        }

        // normalise multiple spaces → single space
        nextValue = nextValue.replace(/\s{2,}/g, " ");
        if (
            name === "name" ||
            name === "city" ||
            name === "state" ||
            name === "country"
        ) {
            nextValue = nextValue
                .split(" ")
                .map((word) =>
                    word
                        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        : ""
                )
                .join(" ");
        }
        const fieldName = name as keyof UpdateProfileFormInput;
        const nextForm: UpdateProfileFormInput = {
            ...form,
            [fieldName]: nextValue,
        };

        setForm(nextForm);

        // live validation for this field
        validateFieldLive(nextForm, fieldName);
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarFile(file);
        setAvatarRemoved(false);
        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
    };

    const handleAvatarRemove = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarRemoved(true);
    };

    const getError = (field: keyof UpdateProfileFormInput | "global") => {
        if (field === "global") return globalError;
        return errors[field];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setSaving(true);

        const parsed = updateProfileSchema.safeParse(form);
        if (!parsed.success) {
            const map: Partial<
                Record<keyof UpdateProfileFormInput | "global", string>
            > = {};
            parsed.error.issues.forEach((issue) => {
                const path = issue.path?.[0] as
                    | keyof UpdateProfileFormInput
                    | "global"
                    | undefined;
                if (path) map[path] = issue.message;
                else map.global = issue.message;
            });
            setErrorsObject(map);
            setSaving(false);
            return;
        }

        const d = parsed.data;

        const payload = {
            name: d.name?.trim() || undefined,
            phoneNumber: d.phoneNumber?.trim() || undefined,
            addressLine1: d.addressLine1 ?? "",
            addressLine2: d.addressLine2 ?? "",
            city: d.city ?? "",
            state: d.state ?? "",
            postalCode: d.postalCode ?? "",
            country: d.country ?? "",
        };

        try {
            const res: ApiResult<UpdateProfileResult> =
                await userService.updateProfile(payload, avatarFile, avatarRemoved);

            if (res.error) {
                handleServerError(res.error);
                toast.error(res.error.message ?? "Failed to update profile");
                setSaving(false);
                return;
            }

            const updated = res.data;
            if (updated) {
                setUser({
                    ...authUser,
                    name: updated.name,
                    email: updated.email,
                    phoneNumber: updated.phoneNumber ?? undefined,
                    profileImage:
                        updated.profileImage !== undefined
                            ? updated.profileImage
                            : authUser.profileImage,
                    addressLine1:
                        updated.addressLine1 !== undefined
                            ? updated.addressLine1
                            : authUser.addressLine1,
                    addressLine2:
                        updated.addressLine2 !== undefined
                            ? updated.addressLine2
                            : authUser.addressLine2,
                    city:
                        updated.city !== undefined ? updated.city : authUser.city,
                    state:
                        updated.state !== undefined ? updated.state : authUser.state,
                    postalCode:
                        updated.postalCode !== undefined
                            ? updated.postalCode
                            : authUser.postalCode,
                    country:
                        updated.country !== undefined
                            ? updated.country
                            : authUser.country,
                } as any);
            }

            toast.success(res.message ?? "Profile updated successfully");
            if(authUser.role==="buyer") navigate(`/user/profile`);
            else navigate(`/${authUser.role}/profile`);

        } catch (err: any) {
            handleServerError(err);
            toast.error(
                err?.message ?? "Something went wrong while updating profile"
            );
        } finally {
            setSaving(false);
        }
    };

    const roleLabel =
        authUser.role === "admin"
            ? "Admin"
            : authUser.role === "vendor"
                ? "Vendor"
                : "Buyer";

  
    const initials =
        (authUser.name ?? authUser.email ?? "U")
            .split(" ")
            .map((s: string) => s.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("") || "U";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-indigo-50 to-slate-100 px-4 py-8">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT PANEL – Avatar + summary */}
                <div className="lg:col-span-1 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-indigo-50 p-6 flex flex-col items-center text-center">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg overflow-hidden">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>

                        <label className="absolute bottom-0 right-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow cursor-pointer border border-indigo-100 hover:bg-indigo-50">
                            <Camera size={18} className="text-indigo-600" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarSelect}
                            />
                        </label>
                    </div>

                    {avatarPreview && (
                        <button
                            type="button"
                            onClick={handleAvatarRemove}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                        >
                            <X size={14} />
                            <span>Remove photo</span>
                        </button>
                    )}

                    <div className="mt-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {form.name || authUser.name || "Your Name"}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">{authUser.email}</p>
                        <p className="mt-1 text-[11px] inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                            <ShieldCheck size={14} />
                            <span className="capitalize">{roleLabel}</span>
                        </p>
                    </div>

                    <div className="mt-6 w-full text-left text-xs text-gray-500 space-y-1.5">
                        <p className="font-semibold text-gray-700">Tip</p>
                        <p>
                            Keep your contact info and address updated to ensure smooth
                            deliveries and account recovery.
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL – form */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Edit profile
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Update your personal details and address information.
                        </p>
                    </div>

                    {getError("global") && (
                        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {getError("global")}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Name & phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    Full name
                                </label>
                                <div className="mt-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-white">
                                    <User2 size={16} className="text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className="w-full text-sm border-none focus:ring-0 focus:outline-none"
                                    />
                                </div>
                                {getError("name") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("name")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    Phone number
                                </label>
                                <div className="mt-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-white">
                                    <Phone size={16} className="text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="9052424561"
                                        inputMode="numeric"
                                        maxLength={10}
                                        className="w-full text-sm border-none focus:ring-0 focus:outline-none"
                                    />
                                </div>
                                {getError("phoneNumber") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("phoneNumber")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Address lines */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700">
                                Address line 1
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-white">
                                <MapPin size={16} className="text-gray-400" />
                                <input
                                    type="text"
                                    name="addressLine1"
                                    value={form.addressLine1}
                                    onChange={handleChange}
                                    placeholder="House / Street / Area"
                                    className="w-full text-sm border-none focus:ring-0 focus:outline-none"
                                />
                            </div>
                            {getError("addressLine1") && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {getError("addressLine1")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">
                                Address line 2 (optional)
                            </label>
                            <input
                                type="text"
                                name="addressLine2"
                                value={form.addressLine2}
                                onChange={handleChange}
                                placeholder="Apartment / Landmark"
                                className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {getError("addressLine2") && (
                                <p className="mt-1 text-xs text-rose-600">
                                    {getError("addressLine2")}
                                </p>
                            )}
                        </div>

                        {/* City / State / Postal / Country */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="City (letters only)"
                                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {getError("city") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("city")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="State "
                                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {getError("state") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("state")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    Postal code
                                </label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    placeholder="6-digit PIN code"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {getError("postalCode") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("postalCode")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    placeholder="Country "
                                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {getError("country") && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {getError("country")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className={`mt-2 w-full inline-flex justify-center items-center px-4 py-2 rounded-full text-sm font-medium text-white shadow ${saving
                                    ? "bg-indigo-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            {saving ? "Saving changes..." : "Save profile"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
}
