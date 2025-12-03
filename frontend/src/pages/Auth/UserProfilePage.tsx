// src/pages/UserProfilePage.tsx
import React, { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router-dom";

import { useAsync } from "@/hooks/useAsync";
import LoadingPage from "@/components/LoadingPage";
import { useServerErrors } from "@/hooks/useServerErrors";
import * as userService from "@/services/userService";
import type { GetProfileResponseData } from "@/services/userService";
import type { ApiResult } from "@/types/api";
import { userProfileSchema, type UserProfile } from "@/validation/profileSchema";
import messages from "@/utils/messages";

export default function UserProfilePage(): JSX.Element {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { loading, run } = useAsync();
  const {
    errors,
    // getError,  // not really needed here, everything is global
    setErrorsObject,
    handleServerError,
    clearErrors,
    globalError,
  } = useServerErrors();

  const loadProfile = async () => {
    clearErrors();
    setProfile(null);

    const { data: runResult, error: runError } = await run(() =>
      userService.getProfile()
    );

    if (runError) {
      handleServerError(runError);
      return;
    }

    const apiResult = runResult as ApiResult<GetProfileResponseData>;

    if (apiResult.error) {
      setErrorsObject({
        ...(apiResult.error.fields || {}),
        global: apiResult.error.message || messages.ERROR.SERVER_ERROR,
      });
      return;
    }

    const data = apiResult.data;
    if (!data) {
      setErrorsObject({
        global: "Profile data is missing.",
      });
      return;
    }

    const parsed = userProfileSchema.safeParse(data);
    if (!parsed.success) {
      setErrorsObject({
        global: "Received invalid profile data. Please try again later.",
      });
      return;
    }

    setProfile(parsed.data);
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !profile) {
    return <LoadingPage message="Loading your profile..." fullScreen />;
  }

  const initials =
    profile?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";

  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "";

  // small helper for label/value rows
  const FieldRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900">
        {value && value !== "" ? value : <span className="text-gray-400">—</span>}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto mt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-indigo-50 overflow-hidden">
          {/* Top gradient header */}
          <div className="h-28 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />

          {/* Content */}
          <div className="-mt-12 px-6 pb-6 sm:px-10 sm:pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name + role + status */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-600">
                      {profile?.name || "Your Profile"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Manage your account information and preferences.
                    </p>
                  </div>

                  {profile && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {/* Role badge */}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {roleLabel || "User"}
                      </span>

                      {/* Active status */}
                      {typeof profile.isActive === "boolean" && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            profile.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              profile.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {profile.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error banner */}
            {globalError && (
              <div className="mt-6 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm">{globalError}</span>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => loadProfile()}
                    className="px-3 py-1 text-xs rounded-full border border-rose-300 bg-white hover:bg-rose-50"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="px-3 py-1 text-xs rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Go to login
                  </button>
                </div>
              </div>
            )}

            {/* Details */}
            {profile && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FieldRow label="Full name" value={profile.name} />
                <FieldRow label="Email" value={profile.email} />
                <FieldRow label="Phone number" value={profile.phoneNumber || ""} />
                <FieldRow label="Role" value={roleLabel} />

                {/* You can add more fields here once backend returns them */}
                {/* <FieldRow label="Address" value={profile.address || ""} /> */}
              </div>
            )}

            {/* Actions row (placeholder for future editing) */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                If any of your details are incorrect, please contact support or update them from your account settings (if enabled).
              </p>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
