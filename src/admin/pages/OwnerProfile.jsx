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
import { CARD, INPUT } from "../components/ui/styles.js";
import { PageHeader } from "../components/ui/primitives.jsx";



const inputClass = INPUT;



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

    PENDING: "bg-warning-subtle text-warning",

    APPROVED: "bg-success-subtle text-success",

    REJECTED: "bg-danger-subtle text-danger",

    CANCELLED: "bg-surface-sunken text-ink-muted",

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



      <PageHeader
        title="My profile"
        description={
          isOwner
            ? "Organization owner account — not listed under Users. Ownership changes require platform approval."
            : "Your account details for this organization."
        }
      />



      <div className={`${CARD} mb-6 flex items-center gap-4 p-5`}>

        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-2xl font-semibold text-brand">

          {profileForm.profilePhoto ? (

            <img src={profileForm.profilePhoto} alt="" className="h-full w-full object-cover" />

          ) : (

            (user?.name?.[0] || user?.email?.[0] || "?").toUpperCase()

          )}

        </div>

        <div>

          <p className="text-lg font-semibold text-ink">{user?.name || "Organization Owner"}</p>

          <p className="text-sm text-ink-subtle">{user?.email}</p>

          {isOwner && (

            <span className="mt-2 inline-block rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand">

              Organization Owner

            </span>

          )}

        </div>

      </div>



      <section className={`${CARD} mb-6 p-6`}>

        <h2 className="text-lg font-semibold text-ink">Profile details</h2>

        <form onSubmit={saveProfile} className="mt-5 space-y-4">

          <div>

            <label className="mb-1 block text-sm text-ink-subtle">Profile picture</label>

            <input type="file" accept="image/*" onChange={handlePhotoFile} className="text-sm text-ink-subtle" />

          </div>

          <div>

            <label className="mb-1 block text-sm text-ink-subtle">Phone</label>

            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputClass} />

          </div>

          <button type="submit" disabled={savingProfile} className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand disabled:opacity-50">

            {savingProfile ? "Saving..." : "Save profile"}

          </button>

        </form>

      </section>



      <section className={`${CARD} mb-6 p-6`}>

        <h2 className="text-lg font-semibold text-ink">Change password</h2>

        <form onSubmit={savePassword} className="mt-5 space-y-4">

          <input type="password" placeholder="Current password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required className={inputClass} />

          <input type="password" placeholder="New password" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} required minLength={6} className={inputClass} />

          <input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required className={inputClass} />

          <button type="submit" disabled={savingPassword} className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand disabled:opacity-50">

            {savingPassword ? "Updating..." : "Update password"}

          </button>

        </form>

      </section>



      {isOwner && (

        <>

          {requests.length > 0 && (

            <section className={`${CARD} mb-6 p-6`}>

              <h2 className="text-lg font-semibold text-ink">Transfer request history</h2>

              <ul className="mt-4 space-y-3">

                {requests.map((req) => (

                  <li key={req.id} className="rounded-control border border-line bg-surface-sunken p-4 text-sm">

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <StatusPill status={req.status} />

                      <span className="text-ink-subtle">{formatDate(req.created_on)}</span>

                    </div>

                    <p className="mt-2 text-ink-muted">

                      New owner: <strong>{req.targetUser?.name}</strong> ({req.targetUser?.email})

                    </p>

                    <p className="text-ink-subtle">Your role if approved: Organization Admin</p>

                    {req.reviewNote && <p className="mt-1 text-ink-subtle">Note: {req.reviewNote}</p>}

                    {req.status === "PENDING" && (

                      <button

                        type="button"

                        disabled={cancellingId === req.id}

                        onClick={() => cancelRequest(req.id)}

                        className="mt-3 text-xs text-danger hover:text-danger"

                      >

                        {cancellingId === req.id ? "Cancelling..." : "Cancel request"}

                      </button>

                    )}

                  </li>

                ))}

              </ul>

            </section>

          )}



          <section className="rounded-surface border border-warning-border bg-warning-subtle p-6">

            <h2 className="text-lg font-semibold text-ink">Request ownership transfer</h2>

            <p className="mt-1 text-sm text-ink-subtle">

              Submit a request for platform super admin approval. Only eligible Organization Admins can become the new owner.

            </p>



            {pendingRequest ? (

              <div className="mt-4 rounded-control border border-warning-border bg-warning-subtle p-4 text-sm text-warning">

                A pending request is awaiting super admin approval. Cancel it to submit a new one.

              </div>

            ) : loadingEligible ? (

              <p className="mt-4 text-sm text-ink-subtle">Loading eligible Organization Admins...</p>

            ) : eligibleUsers.length === 0 ? (

              <div className="mt-4 rounded-control border border-line bg-surface-sunken p-4 text-sm text-ink-subtle">

                No eligible Organization Admins available. A user must be active, have accepted their invitation, and not be blocked.

              </div>

            ) : (

              <div className="mt-5 space-y-4">

                <div>

                  <label className="mb-1 block text-sm text-ink-subtle">New organization owner *</label>

                  <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className={inputClass}>

                    <option value="">Select an Organization Admin</option>

                    {eligibleUsers.map((u) => (

                      <option key={u.id} value={u.id}>

                        {displayName(u)} ({u.email})

                      </option>

                    ))}

                  </select>

                  <p className="mt-1 text-xs text-ink-subtle">

                    Only active Organization Admins who have accepted their invitation are shown.

                  </p>

                </div>

                <div>

                  <label className="mb-1 block text-sm text-ink-subtle">Reason (optional)</label>

                  <textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} rows={3} maxLength={500} placeholder="Why is ownership changing?" className={inputClass} />

                </div>

                <button

                  type="button"

                  disabled={!transferTarget}

                  onClick={() => setShowTransferConfirm(true)}

                  className="rounded-control border border-warning-border bg-warning-subtle px-4 py-2 text-sm font-medium text-warning hover:bg-warning-subtle disabled:opacity-50"

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

              <strong className="text-ink">{targetDisplayName}</strong>?

            </p>

            <p className="mt-2">

              You will lose Organization Owner privileges and become an Organization Admin.

            </p>

            <p className="mt-2 text-ink-subtle">No changes occur until the request is approved by a platform super admin.</p>

          </>

        }

        confirmLabel={submittingRequest ? "Submitting..." : "Submit request"}

        onConfirm={submitTransferRequest}

        onCancel={() => setShowTransferConfirm(false)}

      />

    </div>

  );

}


