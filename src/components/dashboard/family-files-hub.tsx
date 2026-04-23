"use client";

import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Download,
  FileText,
  FileUp,
  FolderOpenDot,
  Image as ImageIcon,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  isLikelyPhoneNumber,
  normalizePhoneForDial,
  type FamilyContactItem,
} from "@/lib/family-contacts";
import {
  familyFileCategories,
  formatFileSize,
  getFamilyFileCategoryLabel,
  isFamilyFileCategory,
  type FamilyFileCategory,
  type FamilyFileItem,
} from "@/lib/family-files";

type FamilyFilesHubProps = {
  initialFiles: FamilyFileItem[];
  initialContacts: FamilyContactItem[];
};

type FilesViewTab = "all" | FamilyFileCategory;

type FileTab = {
  id: FilesViewTab;
  label: string;
  icon: LucideIcon;
};

const fileTabs: FileTab[] = [
  {
    id: "all",
    label: "All",
    icon: FolderOpenDot,
  },
  {
    id: "document",
    label: getFamilyFileCategoryLabel("document"),
    icon: FileText,
  },
  {
    id: "photo",
    label: getFamilyFileCategoryLabel("photo"),
    icon: ImageIcon,
  },
  {
    id: "record",
    label: getFamilyFileCategoryLabel("record"),
    icon: FileUp,
  },
  {
    id: "vault",
    label: getFamilyFileCategoryLabel("vault"),
    icon: ShieldCheck,
  },
];

type CreateFileFormState = {
  title: string;
  category: FamilyFileCategory;
  file: File | null;
};

type CreateContactFormState = {
  fullName: string;
  relation: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  notes: string;
};

function sortFilesByNewest(items: FamilyFileItem[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function sortContactsByName(items: FamilyContactItem[]) {
  return [...items].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }),
  );
}

function parseApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Something went wrong. Please try again.";
}

async function parseJson(response: Response) {
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }

    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function FamilyFilesHub({
  initialFiles,
  initialContacts,
}: FamilyFilesHubProps) {
  const [activeFileTab, setActiveFileTab] = useState<FilesViewTab>("all");
  const [files, setFiles] = useState<FamilyFileItem[]>(
    sortFilesByNewest(initialFiles),
  );
  const [contacts, setContacts] = useState<FamilyContactItem[]>(
    sortContactsByName(initialContacts),
  );
  const [fileForm, setFileForm] = useState<CreateFileFormState>({
    title: "",
    category: "document",
    file: null,
  });
  const [contactForm, setContactForm] = useState<CreateContactFormState>({
    fullName: "",
    relation: "",
    phone: "",
    secondaryPhone: "",
    email: "",
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [pendingFileDeleteId, setPendingFileDeleteId] = useState<string | null>(
    null,
  );
  const [pendingContactDeleteId, setPendingContactDeleteId] = useState<
    string | null
  >(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const visibleFiles = useMemo(() => {
    if (activeFileTab === "all") {
      return files;
    }

    return files.filter((file) => file.category === activeFileTab);
  }, [activeFileTab, files]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const haystack = [
        contact.fullName,
        contact.relation,
        contact.phone,
        contact.secondaryPhone,
        contact.email,
        contact.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [contacts, searchQuery]);

  const handleUploadFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = fileForm.title.trim();
    if (!title) {
      setFileError("Please add a file title.");
      return;
    }

    if (!familyFileCategories.includes(fileForm.category)) {
      setFileError("Please choose a valid file category.");
      return;
    }

    if (!fileForm.file) {
      setFileError("Please choose a file to upload.");
      return;
    }

    setFileError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", fileForm.category);
      formData.append("file", fileForm.file);

      const response = await fetch("/api/family-files", {
        method: "POST",
        body: formData,
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        if (response.status === 413) {
          setFileError(
            "This photo is too large for the current server upload limit. Try a smaller file.",
          );
          return;
        }

        setFileError(parseApiError(payload));
        return;
      }

      const uploadedFile =
        payload &&
        typeof payload === "object" &&
        "file" in payload &&
        payload.file &&
        typeof payload.file === "object"
          ? (payload.file as FamilyFileItem)
          : null;

      if (!uploadedFile || !isFamilyFileCategory(uploadedFile.category)) {
        setFileError("File was uploaded, but response data was invalid.");
        return;
      }

      setFiles((previous) => sortFilesByNewest([uploadedFile, ...previous]));
      setFileForm({
        title: "",
        category: fileForm.category,
        file: null,
      });
      setFileInputKey((previous) => previous + 1);
    } catch {
      setFileError("Could not upload this file right now.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!window.confirm("Remove this file from family files?")) {
      return;
    }

    setFileError(null);
    setPendingFileDeleteId(fileId);

    try {
      const response = await fetch(`/api/family-files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setFileError(parseApiError(payload));
        return;
      }

      setFiles((previous) => previous.filter((file) => file.id !== fileId));
    } catch {
      setFileError("Could not remove this file right now.");
    } finally {
      setPendingFileDeleteId(null);
    }
  };

  const handleAddContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = contactForm.fullName.trim();
    const phone = contactForm.phone.trim();

    if (!fullName) {
      setContactError("Please add a name for this contact.");
      return;
    }

    if (!phone) {
      setContactError("Please add a primary phone number.");
      return;
    }

    if (!isLikelyPhoneNumber(phone)) {
      setContactError("Primary phone format looks invalid.");
      return;
    }

    if (
      contactForm.secondaryPhone.trim() &&
      !isLikelyPhoneNumber(contactForm.secondaryPhone.trim())
    ) {
      setContactError("Secondary phone format looks invalid.");
      return;
    }

    setContactError(null);
    setIsSavingContact(true);

    try {
      const response = await fetch("/api/family-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          relation: contactForm.relation.trim() || undefined,
          phone,
          secondaryPhone: contactForm.secondaryPhone.trim() || undefined,
          email: contactForm.email.trim() || undefined,
          notes: contactForm.notes.trim() || undefined,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setContactError(parseApiError(payload));
        return;
      }

      const createdContact =
        payload &&
        typeof payload === "object" &&
        "contact" in payload &&
        payload.contact &&
        typeof payload.contact === "object"
          ? (payload.contact as FamilyContactItem)
          : null;

      if (!createdContact || typeof createdContact.fullName !== "string") {
        setContactError("Contact was saved, but response data was invalid.");
        return;
      }

      setContacts((previous) =>
        sortContactsByName([...previous, createdContact]),
      );
      setContactForm({
        fullName: "",
        relation: "",
        phone: "",
        secondaryPhone: "",
        email: "",
        notes: "",
      });
    } catch {
      setContactError("Could not save this contact right now.");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    setContactError(null);
    setPendingContactDeleteId(contactId);

    try {
      const response = await fetch(`/api/family-contacts/${contactId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setContactError(parseApiError(payload));
        return;
      }

      setContacts((previous) =>
        previous.filter((contact) => contact.id !== contactId),
      );
    } catch {
      setContactError("Could not remove this contact right now.");
    } finally {
      setPendingContactDeleteId(null);
    }
  };

  const handleSelectFileTab = (tabId: FilesViewTab) => {
    setActiveFileTab(tabId);

    if (tabId !== "all") {
      setFileForm((previous) => ({
        ...previous,
        category: tabId,
      }));
    }
  };

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fc-pill">
            <FolderOpenDot className="h-4 w-4 text-sage" />
            Shared workspace
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
            Family files
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 fc-text-muted">
            Upload real files and photos for your family, and keep important
            numbers close in the phone book.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="space-y-4">
          <div
            role="tablist"
            aria-label="Family file categories"
            className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5"
          >
            {fileTabs.map((tab) => {
              const isActive = tab.id === activeFileTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`family-files-tab-${tab.id}`}
                  aria-controls={`family-files-panel-${tab.id}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelectFileTab(tab.id)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.09em] transition",
                    isActive
                      ? "border-[#a98868] bg-[#f4e7d4] text-[#2f433a]"
                      : "border-[#d7c6ae] bg-[#fff9f0] text-[#576961] hover:border-[#bea789] hover:text-[#2f433a]",
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b63]">
              Upload file
            </p>
            <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={handleUploadFile}>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Title
                </span>
                <input
                  value={fileForm.title}
                  onChange={(event) =>
                    setFileForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Insurance policy renewal"
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Category
                </span>
                <select
                  value={fileForm.category}
                  onChange={(event) =>
                    setFileForm((previous) => ({
                      ...previous,
                      category: event.target.value as FamilyFileCategory,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                >
                  {familyFileCategories.map((category) => (
                    <option key={category} value={category}>
                      {getFamilyFileCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  File
                </span>
                <input
                  key={fileInputKey}
                  type="file"
                  onChange={(event) =>
                    setFileForm((previous) => ({
                      ...previous,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] file:mr-3 file:rounded-md file:border-0 file:bg-[#eed6bc] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-[#45574e] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isUploading}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <FileUp className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload file"}
              </button>
            </form>
            {fileError ? (
              <p className="mt-2 text-xs font-semibold text-[#8f4325]">{fileError}</p>
            ) : null}
          </div>

          <section
            id={`family-files-panel-${activeFileTab}`}
            role="tabpanel"
            aria-labelledby={`family-files-tab-${activeFileTab}`}
            className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b63]">
                {activeFileTab === "all"
                  ? "Recent uploads"
                  : `${getFamilyFileCategoryLabel(activeFileTab)} files`}
              </p>
              <p className="text-xs fc-text-muted">
                {visibleFiles.length} file{visibleFiles.length === 1 ? "" : "s"}
              </p>
            </div>

            {visibleFiles.length > 0 ? (
              <div className="mt-3 space-y-3">
                {visibleFiles.map((file) => {
                  const isImage = file.mimeType.startsWith("image/");
                  const formattedDate = fullDateFormatter.format(
                    new Date(file.createdAt),
                  );

                  return (
                    <article
                      key={file.id}
                      className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2f4138]">
                            {file.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#5e6f67]">
                            {file.originalName}
                          </p>
                        </div>
                        <p className="shrink-0 rounded-full border border-[#d0bca2] bg-[#f3e4d1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#50625a]">
                          {getFamilyFileCategoryLabel(file.category)}
                        </p>
                      </div>

                      {isImage ? (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block overflow-hidden rounded-md border border-[#d4c2a7]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.fileUrl}
                            alt={file.title}
                            className="h-32 w-full object-cover"
                          />
                        </a>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a706a]">
                          {formatFileSize(file.sizeBytes)} - {formattedDate}
                        </p>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-[#c9b497] bg-[#fff3e4] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#56675f] transition hover:border-[#b59a78] hover:text-[#2d3f36]"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            View
                          </a>
                          <a
                            href={`${file.fileUrl}?download=1`}
                            download={file.originalName}
                            className="inline-flex items-center gap-1 rounded-md border border-[#c9b497] bg-[#fff3e4] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#56675f] transition hover:border-[#b59a78] hover:text-[#2d3f36]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Save
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            disabled={pendingFileDeleteId === file.id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {pendingFileDeleteId === file.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                No files here yet. Upload your first item above.
              </p>
            )}
          </section>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
              <Phone className="h-4 w-4 text-accent" />
              Family phone book
            </p>
            <form className="mt-3 space-y-2" onSubmit={handleAddContact}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Name
                </span>
                <input
                  value={contactForm.fullName}
                  onChange={(event) =>
                    setContactForm((previous) => ({
                      ...previous,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Grandma Rose"
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Primary phone
                  </span>
                  <input
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="555-123-4567"
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Secondary
                  </span>
                  <input
                    value={contactForm.secondaryPhone}
                    onChange={(event) =>
                      setContactForm((previous) => ({
                        ...previous,
                        secondaryPhone: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Relation
                  </span>
                  <input
                    value={contactForm.relation}
                    onChange={(event) =>
                      setContactForm((previous) => ({
                        ...previous,
                        relation: event.target.value,
                      }))
                    }
                    placeholder="Neighbor"
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Email
                  </span>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Notes
                </span>
                <textarea
                  value={contactForm.notes}
                  onChange={(event) =>
                    setContactForm((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Best after 6pm"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingContact}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <UserPlus className="h-4 w-4" />
                {isSavingContact ? "Saving..." : "Add contact"}
              </button>
            </form>
            {contactError ? (
              <p className="mt-2 text-xs font-semibold text-[#8f4325]">
                {contactError}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#d8c8b1] bg-[#fffaf2] p-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                Find contact
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5">
                <Search className="h-4 w-4 text-[#63746b]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name or number"
                  className="w-full bg-transparent py-2 text-sm text-[#2f4038] outline-none"
                />
              </div>
            </label>

            {filteredContacts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {filteredContacts.map((contact) => (
                  <article
                    key={contact.id}
                    className="rounded-lg border border-[#d6c5ac] bg-[#fff6e9] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#2f4138]">
                          {contact.fullName}
                        </p>
                        {contact.relation ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62736a]">
                            {contact.relation}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        disabled={pendingContactDeleteId === contact.id}
                        className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {pendingContactDeleteId === contact.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-[#4b5f56]">
                      <a
                        href={`tel:${normalizePhoneForDial(contact.phone)}`}
                        className="inline-flex font-semibold text-[#345147] hover:text-[#223a32]"
                      >
                        {contact.phone}
                      </a>
                      {contact.secondaryPhone ? (
                        <p>Alt: {contact.secondaryPhone}</p>
                      ) : null}
                      {contact.email ? <p>{contact.email}</p> : null}
                      {contact.notes ? <p>{contact.notes}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                No contacts yet. Add your first important number above.
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
