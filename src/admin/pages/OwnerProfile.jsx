import { useEffect, useState } from "react";

import {

  cancelOwnershipTransferRequest,

  changePassword,

  createOwnershipTransferRequest,

  fetchEligibleOwnershipTargets,

  fetchMyOwnershipTransferRequests,

  updateMyProfile,

} from "../api/admin.js";

import { getErrorMessage } from "../api/client.js";

import Breadcrumb from "../components/ui/Breadcrumb.jsx";

import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";

import { useToast } from "../components/ui/Toast.jsx";

import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { isOrganizationOwner } from "../utils/tenantUsers.js";
import { useAuditLog } from "../hooks/useUserProfiles.js";



const inputClass = "admin-input";



function formatDate(iso) {

  if (!iso) return "—";

  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

}



function displayName(user) {

  if (!user) return "";

  if (user.firstName || user.lastName) {

    return `${user.firstName || ""} ${user.lastName || ""}`.trim();

  }

  return user.name || user.email || "";

}



function StatusPill({ status }) {

  const styles = {

    PENDING: "bg-amber-100 text-amber-600",

    APPROVED: "bg-emerald-100 text-emerald-600",

    REJECTED: "bg-red-100 text-red-600",

    CANCELLED: "bg-slate-100 text-slate-600",

  };

  return (

    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>

  );

}



export default function OwnerProfile() {

  const { user, refresh } = useAdminAuth();

  const { toast } = useToast();

  const { append: audit } = useAuditLog();



  const [profileForm, setProfileForm] = useState({ phone: "", profilePhoto: "" });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  const [transferTarget, setTransferTarget] = useState("");

  const [transferReason, setTransferReason] = useState("");

  const [eligibleUsers, setEligibleUsers] = useState([]);

  const [loadingEligible, setLoadingEligible] = useState(false);

  const [requests, setRequests] = useState([]);

  const [savingProfile, setSavingProfile] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);

  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);



  const isOwner = isOrganizationOwner(user);

  const pendingRequest = requests.find((r) => r.status === "PENDING");



  useEffect(() => {

    if (user) {

      setProfileForm({ phone: user.phone || "", profilePhoto: user.profilePhoto || "" });

    }

  }, [user]);



  const loadRequests = () => {

    if (!isOwner) return;

    fetchMyOwnershipTransferRequests()

      .then((data) => setRequests(data?.requests || []))

      .catch(() => setRequests([]));

  };



  useEffect(() => {

    loadRequests();

  }, [isOwner]);



  const loadEligibleTargets = () => {

    if (!isOwner) return;

    setLoadingEligible(true);

    fetchEligibleOwnershipTargets()

      .then((data) => {

        const list = Array.isArray(data) ? data : data?.users || [];

        setEligibleUsers(

          list.map((u) => ({

            ...u,

            id: u.id || u._id,

            firstName: u.firstName || u.name?.split(" ")[0] || "",

            lastName: u.lastName || u.name?.split(" ").slice(1).join(" ") || "",

          }))

        );

      })

      .catch(() => setEligibleUsers([]))

      .finally(() => setLoadingEligible(false));

  };



  useEffect(() => {

    loadEligibleTargets();

  }, [isOwner]);



  const handlePhotoFile = (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 500_000) {

      toast("Image must be under 500KB", "error");

      return;

    }

    const reader = new FileReader();

    reader.onload = () => setProfileForm({ ...profileForm, profilePhoto: reader.result });

    reader.readAsDataURL(file);

  };



  const saveProfile = async (e) => {

    e.preventDefault();

    setSavingProfile(true);

    try {

      await updateMyProfile({ phone: profileForm.phone.trim(), profilePhoto: profileForm.profilePhoto });

      await refresh();

      audit({ action: "owner.profile_updated", userId: user.id });

      toast("Profile updated", "success");

    } catch (err) {

      toast(getErrorMessage(err), "error");

    } finally {

      setSavingProfile(false);

    }

  };



  const savePassword = async (e) => {

    e.preventDefault();

    if (passwordForm.next.length < 6) {

      toast("New password must be at least 6 characters", "error");

      return;

    }

    if (passwordForm.next !== passwordForm.confirm) {

      toast("Passwords do not match", "error");

      return;

    }

    setSavingPassword(true);

    try {

      await changePassword(passwordForm.current, passwordForm.next);

      setPasswordForm({ current: "", next: "", confirm: "" });

      toast("Password changed successfully", "success");

    } catch (err) {

      toast(getErrorMessage(err), "error");

    } finally {

      setSavingPassword(false);

    }

  };



  const submitTransferRequest = async () => {

    setSubmittingRequest(true);

    try {

      await createOwnershipTransferRequest({

        targetUserId: transferTarget,

        reason: transferReason.trim(),

      });

      audit({ action: "ownership.transfer_requested", userId: user.id, targetUserId: transferTarget });

      toast("Transfer request submitted for platform approval", "success");

      setShowTransferConfirm(false);

      setTransferTarget("");

      setTransferReason("");

      loadRequests();

    } catch (err) {

      toast(getErrorMessage(err), "error");

    } finally {

      setSubmittingRequest(false);

    }

  };



  const cancelRequest = async (id) => {

    setCancellingId(id);

    try {

      await cancelOwnershipTransferRequest(id);

      toast("Request cancelled", "success");

      loadRequests();

    } catch (err) {

      toast(getErrorMessage(err), "error");

    } finally {

      setCancellingId(null);

    }

  };



  const targetUser = eligibleUsers.find((u) => u.id === transferTarget);

  const targetDisplayName = displayName(targetUser);



  return (

    <div className="mx-auto max-w-3xl">

      <Breadcrumb items={[{ label: "Organization", to: "/admin" }, { label: "My profile" }]} />



      <div className="mb-8">

        <h1 className="text-2xl font-bold text-slate-900">My profile</h1>

        <p className="mt-1 text-slate-500">

          {isOwner

            ? "Organization owner account — not listed under Users. Ownership changes require platform approval."

            : "Update your account settings."}

        </p>

      </div>



      <div className="admin-card mb-6 flex items-center gap-4 p-5">

        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-600">

          {profileForm.profilePhoto ? (

            <img src={profileForm.profilePhoto} alt="" className="h-full w-full object-cover" />

          ) : (

            (user?.name?.[0] || user?.email?.[0] || "?").toUpperCase()

          )}

        </div>

        <div>

          <p className="text-lg font-semibold text-slate-900">{user?.name || "Organization Owner"}</p>

          <p className="text-sm text-slate-500">{user?.email}</p>

          {isOwner && (

            <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-600">

              Organization Owner

            </span>

          )}

        </div>

      </div>



      <section className="admin-card mb-6 p-6">

        <h2 className="text-lg font-semibold text-slate-900">Profile details</h2>

        <form onSubmit={saveProfile} className="mt-5 space-y-4">

          <div>

            <label className="mb-1 block text-sm text-slate-500">Profile picture</label>

            <input type="file" accept="image/*" onChange={handlePhotoFile} className="text-sm text-slate-500" />

          </div>

          <div>

            <label className="mb-1 block text-sm text-slate-500">Phone</label>

            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputClass} />

          </div>

          <button type="submit" disabled={savingProfile} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">

            {savingProfile ? "Saving..." : "Save profile"}

          </button>

        </form>

      </section>



      <section className="admin-card mb-6 p-6">

        <h2 className="text-lg font-semibold text-slate-900">Change password</h2>

        <form onSubmit={savePassword} className="mt-5 space-y-4">

          <input type="password" placeholder="Current password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required className={inputClass} />

          <input type="password" placeholder="New password" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} required minLength={6} className={inputClass} />

          <input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required className={inputClass} />

          <button type="submit" disabled={savingPassword} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">

            {savingPassword ? "Updating..." : "Update password"}

          </button>

        </form>

      </section>



      {isOwner && (

        <>

          {requests.length > 0 && (

            <section className="admin-card mb-6 p-6">

              <h2 className="text-lg font-semibold text-slate-900">Transfer request history</h2>

              <ul className="mt-4 space-y-3">

                {requests.map((req) => (

                  <li key={req.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <StatusPill status={req.status} />

                      <span className="text-slate-500">{formatDate(req.created_on)}</span>

                    </div>

                    <p className="mt-2 text-slate-700">

                      New owner: <strong>{req.targetUser?.name}</strong> ({req.targetUser?.email})

                    </p>

                    <p className="text-slate-500">Your role if approved: Organization Admin</p>

                    {req.reviewNote && <p className="mt-1 text-slate-500">Note: {req.reviewNote}</p>}

                    {req.status === "PENDING" && (

                      <button

                        type="button"

                        disabled={cancellingId === req.id}

                        onClick={() => cancelRequest(req.id)}

                        className="mt-3 text-xs text-red-600 hover:text-red-700"

                      >

                        {cancellingId === req.id ? "Cancelling..." : "Cancel request"}

                      </button>

                    )}

                  </li>

                ))}

              </ul>

            </section>

          )}



          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">

            <h2 className="text-lg font-semibold text-slate-900">Request ownership transfer</h2>

            <p className="mt-1 text-sm text-slate-500">

              Submit a request for platform super admin approval. Only eligible Organization Admins can become the new owner.

            </p>



            {pendingRequest ? (

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-100 p-4 text-sm text-amber-800">

                A pending request is awaiting super admin approval. Cancel it to submit a new one.

              </div>

            ) : loadingEligible ? (

              <p className="mt-4 text-sm text-slate-500">Loading eligible Organization Admins...</p>

            ) : eligibleUsers.length === 0 ? (

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">

                No eligible Organization Admins available. A user must be active, have accepted their invitation, and not be blocked.

              </div>

            ) : (

              <div className="mt-5 space-y-4">

                <div>

                  <label className="mb-1 block text-sm text-slate-500">New organization owner *</label>

                  <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className={inputClass}>

                    <option value="">Select an Organization Admin</option>

                    {eligibleUsers.map((u) => (

                      <option key={u.id} value={u.id}>

                        {displayName(u)} ({u.email})

                      </option>

                    ))}

                  </select>

                  <p className="mt-1 text-xs text-slate-500">

                    Only active Organization Admins who have accepted their invitation are shown.

                  </p>

                </div>

                <div>

                  <label className="mb-1 block text-sm text-slate-500">Reason (optional)</label>

                  <textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} rows={3} maxLength={500} placeholder="Why is ownership changing?" className={inputClass} />

                </div>

                <button

                  type="button"

                  disabled={!transferTarget}

                  onClick={() => setShowTransferConfirm(true)}

                  className="rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"

                >

                  Submit for approval

                </button>

              </div>

            )}

          </section>

        </>

      )}



      <ConfirmDialog

        open={showTransferConfirm}

        title="Transfer ownership?"

        message={

          <>

            <p>

              Are you sure you want to transfer ownership to{" "}

              <strong className="text-slate-800">{targetDisplayName}</strong>?

            </p>

            <p className="mt-2">

              You will lose Organization Owner privileges and become an Organization Admin.

            </p>

            <p className="mt-2 text-slate-500">No changes occur until the request is approved by a platform super admin.</p>

          </>

        }

        confirmLabel={submittingRequest ? "Submitting..." : "Submit request"}

        onConfirm={submitTransferRequest}

        onCancel={() => setShowTransferConfirm(false)}

      />

    </div>

  );

}


