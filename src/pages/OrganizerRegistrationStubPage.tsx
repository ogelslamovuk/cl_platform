import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HelpTooltip from "@/components/ui/help-tooltip";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  createPendingOrganizerAccount,
  defaultIdentityRecord,
  defaultOrganizerApplicationData,
  type IdentityRecord,
  type OrganizerApplicationData,
  upsertOrganizerApplication,
} from "@/lib/store";
import { formatPublicId } from "@/lib/display";

function emptyPerson(): IdentityRecord {
  return defaultIdentityRecord();
}

function mockAttachment(attachmentId: string, name: string, kind: string): OrganizerApplicationData["documents"][number] {
  return {
    attachmentId,
    name,
    kind,
    uploadedAt: new Date().toISOString(),
    isSample: true,
  };
}

const ATTACHMENT_LABELS: Record<string, string> = {
  "past-video": "Видеоотчёт прошедшего мероприятия.mp4",
  "past-audio": "Аудиозапись прошедшего мероприятия.mp3",
  "past-script": "Сценарий прошедшего мероприятия.pdf",
  "registry-statement": "Заявление на включение в реестр.pdf",
  "registry-appendix": "Приложение к заявлению.pdf",
  "sample-registry": "Образец заявления.pdf",
};

function buildMockOrganizerApplicationData(): OrganizerApplicationData {
  return {
    ...defaultOrganizerApplicationData(),
    legalName: "Государственное учреждение культуры «Минский городской центр культурных инициатив»",
    registrationNumber: "192837465",
    postalCode: "220030",
    region: "г. Минск",
    locality: "Минск",
    street: "ул. Интернациональная",
    houseNumber: "25",
    roomTypeAndNumber: "кабинет 304",
    addressExtra: "административный корпус, вход со двора",
    contactPhone: "+375 (17) 327-45-10",
    website: "https://culture-minsk.by",
    email: "registry@culture-minsk.by",
    ownershipType: "state",
    director: {
      fullName: "Морозова Елена Викторовна",
      docType: "паспорт гражданина Республики Беларусь",
      docNumber: "MP1234567",
      issueDate: "2021-04-16",
      issueAuthority: "Центральное РУВД г. Минска",
    },
    workers: [
      {
        fullName: "Петровский Антон Сергеевич",
        docType: "паспорт гражданина Республики Беларусь",
        docNumber: "MP7654321",
        issueDate: "2022-02-08",
        issueAuthority: "Фрунзенское РУВД г. Минска",
      },
    ],
    founders: [
      {
        fullName: "Минский городской исполнительный комитет",
        docType: "учредитель государственного учреждения",
        docNumber: "FOUND-001",
        issueDate: "2020-01-10",
        issueAuthority: "Единый государственный регистр",
      },
    ],
    activities: ["Концерты", "Фестивали", "Выставки"],
    activityOther: "организация культурно-зрелищных мероприятий городского значения",
    pastEventsDescription: "Городской фестиваль культуры, концерт ко Дню города и выставочная программа в Верхнем городе.",
    pastMaterials: [
      mockAttachment("mock-past-program-001", "Программа городского фестиваля.pdf", "past-program"),
      mockAttachment("mock-past-photo-001", "Фотоотчёт культурной программы.pdf", "past-material"),
    ],
    documents: [
      mockAttachment("mock-registry-statement-001", "Заявление на включение в реестр.pdf", "registry-statement"),
      mockAttachment("mock-registry-appendix-001", "Приложение к заявлению.pdf", "registry-appendix"),
      mockAttachment("mock-charter-001", "Положение государственного учреждения.pdf", "charter"),
    ],
    confirmations: { isAccurate: true, adminReviewConsent: true },
    accountCredentials: { login: "organizer.mok", password: "demo123" },
  };
}

export default function OrganizerRegistrationStubPage() {
  const navigate = useNavigate();
  const { state, update } = useStorageSync();
  const [form, setForm] = useState(defaultOrganizerApplicationData());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [mockSyncAt, setMockSyncAt] = useState<string | null>(null);

  const missingRequiredFields = useMemo(() => {
    const missing: string[] = [];
    if (!form.legalName.trim()) missing.push("legalName");
    if (!form.registrationNumber.trim()) missing.push("registrationNumber");
    if (!form.postalCode.trim()) missing.push("postalCode");
    if (!form.region.trim()) missing.push("region");
    if (!form.locality.trim()) missing.push("locality");
    if (!form.street.trim()) missing.push("street");
    if (!form.houseNumber.trim()) missing.push("houseNumber");
    if (!form.contactPhone.trim()) missing.push("contactPhone");
    if (!form.email.trim()) missing.push("email");
    if (!form.director.fullName.trim()) missing.push("director.fullName");
    if (!form.director.docType.trim()) missing.push("director.docType");
    if (!form.director.docNumber.trim()) missing.push("director.docNumber");
    if (!form.director.issueDate.trim()) missing.push("director.issueDate");
    if (!form.director.issueAuthority.trim()) missing.push("director.issueAuthority");
    if (form.activities.length === 0 && !form.activityOther.trim()) missing.push("activities");
    if (!form.accountCredentials.login.trim()) missing.push("accountCredentials.login");
    if (!form.accountCredentials.password.trim()) missing.push("accountCredentials.password");
    return missing;
  }, [form]);

  const hasMissingRequiredFields = missingRequiredFields.length > 0;
  const hasMissingConfirmations = !form.confirmations.adminReviewConsent || !form.confirmations.isAccurate;
  const applicationPublicId = formatPublicId("ORGAPP-1");
  const requiredTotal = 17;
  const completedRequired = Math.max(0, requiredTotal - missingRequiredFields.length);
  const nextAction = hasMissingRequiredFields
    ? "Заполнить обязательные сведения"
    : hasMissingConfirmations
      ? "Подтвердить сведения и согласие на рассмотрение"
      : "Отправить заявку на рассмотрение";

  const fieldClass = (invalid: boolean) =>
    `h-10 rounded px-3 bg-[#0F1620] border ${invalid ? "border-[#EF4444]" : ""}`;

  const updateDirector = (patch: Partial<IdentityRecord>) => {
    setForm((prev) => ({ ...prev, director: { ...prev.director, ...patch } }));
  };

  const addAttachment = (kind: string, isSample = false) => {
    const file = {
      attachmentId: `${kind}-${Date.now()}`,
      kind,
      isSample,
      name: ATTACHMENT_LABELS[kind] || "Документ к заявке.pdf",
      uploadedAt: new Date().toISOString(),
    };
    if (kind.startsWith("past")) {
      setForm((prev) => ({ ...prev, pastMaterials: [...prev.pastMaterials, file] }));
    } else {
      setForm((prev) => ({ ...prev, documents: [...prev.documents, file] }));
    }
  };

  const save = (submit: boolean) => {
    if (submit) {
      setSubmitAttempted(true);
    }

    if (submit && hasMissingRequiredFields) {
      toast.error("Заполните обязательные поля.");
      return;
    }

    if (submit && hasMissingConfirmations) {
      toast.error("Подтвердите достоверность сведений и согласие на рассмотрение заявки.");
      return;
    }

    const organizer = createPendingOrganizerAccount(state, {
      legalName: form.legalName,
      registrationNumber: form.registrationNumber,
      directorName: form.director.fullName,
      email: form.email,
      phone: form.contactPhone,
      login: form.accountCredentials.login,
      password: form.accountCredentials.password,
    });

    const rec = upsertOrganizerApplication(state, organizer.organizerId, form, submit);
    if (submit) {
      state.currentOrganizerId = organizer.organizerId;
    }
    update({ ...state });

    toast.success(submit ? "Заявка отправлена на рассмотрение. Результат будет направлен на указанный email." : "Черновик сохранён");
    if (submit) {
      navigate("/organizer", { replace: true });
    }
  };

  const fillMockOrganizer = () => {
    setForm(buildMockOrganizerApplicationData());
    setSubmitAttempted(false);
    setMockSyncAt(new Date().toISOString());
    toast.success("Сведения синхронизированы в демонстрационном режиме.");
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0B0F14", color: "#F5F7FA" }}>
      <Sonner />
      <div className="mx-auto max-w-4xl rounded-2xl border p-6 space-y-6" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
        <div>
          <h1 className="text-2xl font-bold mb-2">Заявка на статус организатора</h1>
          <p className="text-sm" style={{ color: "rgba(245,247,250,0.72)" }}>Форма для включения в реестр организаторов.</p>
          <p className="text-xs mt-2" style={{ color: "rgba(245,247,250,0.72)" }}>Поля, отмеченные *, обязательны.</p>
        </div>

        <section className="rounded-2xl border p-4" style={{ borderColor: "rgba(96,165,250,0.24)", background: "rgba(15,22,32,0.92)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(147,197,253,0.35)", background: "rgba(96,165,250,0.12)", color: "#BFDBFE" }}>{applicationPublicId}</span>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(242,201,76,0.35)", background: "rgba(242,201,76,0.12)", color: "#FDE68A" }}>Черновик</span>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: mockSyncAt ? "rgba(52,211,153,0.35)" : "rgba(148,163,184,0.28)", background: mockSyncAt ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.10)", color: mockSyncAt ? "#BBF7D0" : "#CBD5E1" }}>
              {mockSyncAt ? "Сведения сверены" : "Ожидает сверки"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
              <div className="text-xs opacity-65">Организация</div>
              <div className="mt-1 text-sm font-semibold">{form.legalName || "наименование не указано"}</div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
              <div className="text-xs opacity-65">Регион</div>
              <div className="mt-1 text-sm font-semibold">{form.region || "регион не указан"}</div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
              <div className="text-xs opacity-65">Заполнено</div>
              <div className="mt-1 text-sm font-semibold">{completedRequired} из {requiredTotal} обязательных полей</div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.10)", background: "#111A24" }}>
              <div className="text-xs opacity-65">Следующее действие</div>
              <div className="mt-1 text-sm font-semibold">{nextAction}</div>
            </div>
          </div>
        </section>

        <div className="sticky top-4 z-20 rounded-2xl border p-4" style={{ borderColor: "rgba(242,201,76,0.32)", background: "rgba(15,22,32,0.96)", boxShadow: "0 16px 42px rgba(0,0,0,0.28)" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Проверка по публичному реестру</div>
              {mockSyncAt ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(34,197,94,0.16)", color: "#BBF7D0" }}>УНП найден в публичном реестре</span>
                  <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(59,130,246,0.16)", color: "#BFDBFE" }}>Сведения синхронизированы</span>
                  <span style={{ color: "rgba(245,247,250,0.62)" }}>проверено: {mockSyncAt.replace("T", " ").slice(0, 16)}</span>
                </div>
              ) : (
                <p className="mt-1 text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Кнопка заполнит форму демонстрационными сведениями организации культуры.</p>
              )}
            </div>
            <button
              type="button"
              className="h-11 rounded-xl px-5 text-sm font-semibold"
              style={{ background: "#F2C94C", color: "#111" }}
              onClick={fillMockOrganizer}
            >
              Заполнить примером
            </button>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Сведения об организации и юридический адрес</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("legalName") ? "border-[#EF4444]" : ""}`} placeholder="Полное наименование *" value={form.legalName} onChange={(e) => setForm((p) => ({ ...p, legalName: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите официальное наименование юридического лица без сокращений." /></div>
            </div>
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("registrationNumber") ? "border-[#EF4444]" : ""}`} placeholder="Регистрационный номер *" value={form.registrationNumber} onChange={(e) => setForm((p) => ({ ...p, registrationNumber: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите номер госрегистрации или УНП, как в регистрационных документах." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("postalCode"))} w-full pr-9`} placeholder="Почтовый индекс *" value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите шестизначный почтовый индекс юридического адреса." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("region"))} w-full pr-9`} placeholder="Область *" value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите область юридического адреса." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("locality"))} w-full pr-9`} placeholder="Населённый пункт *" value={form.locality} onChange={(e) => setForm((p) => ({ ...p, locality: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите город или населённый пункт." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("street"))} w-full pr-9`} placeholder="Улица / проспект *" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите название улицы или проспекта." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("houseNumber"))} w-full pr-9`} placeholder="Номер дома *" value={form.houseNumber} onChange={(e) => setForm((p) => ({ ...p, houseNumber: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите номер дома по юридическому адресу." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Помещение" value={form.roomTypeAndNumber} onChange={(e) => setForm((p) => ({ ...p, roomTypeAndNumber: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите номер офиса или помещения." /></div>
            </div>
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("contactPhone") ? "border-[#EF4444]" : ""}`} placeholder="Контактный телефон *" value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите телефон для связи по доработкам и статусу заявки." /></div>
            </div>
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("email") ? "border-[#EF4444]" : ""}`} placeholder="Электронная почта *" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите электронный адрес для получения уведомлений." /></div>
            </div>
            <div className="relative">
              <input className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" placeholder="Интернет-сайт" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите официальный веб-сайт организации." /></div>
            </div>
            <div className="relative">
            <select className="h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border" value={form.ownershipType} onChange={(e) => setForm((p) => ({ ...p, ownershipType: e.target.value as "private" | "state" | "mixed" }))}>
              <option value="private">Частная</option>
              <option value="state">Государственная</option>
              <option value="mixed">Смешанная</option>
            </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Выберите форму собственности организации." /></div>
            </div>
          </div>
          <div className="relative">
            <textarea className="w-full min-h-20 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Дополнительные сведения об адресе" value={form.addressExtra} onChange={(e) => setForm((p) => ({ ...p, addressExtra: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Укажите корпус, этаж или другую дополнительную информацию по адресу." /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Руководитель и контактные лица</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("director.fullName") ? "border-[#EF4444]" : ""}`} placeholder="ФИО руководителя *" value={form.director.fullName} onChange={(e) => updateDirector({ fullName: e.target.value })} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите ФИО руководителя точно как в удостоверяющем документе." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("director.docType"))} w-full pr-9`} placeholder="Вид документа *" value={form.director.docType} onChange={(e) => updateDirector({ docType: e.target.value })} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите тип документа, удостоверяющего личность." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("director.docNumber"))} w-full pr-9`} placeholder="Серия / номер документа *" value={form.director.docNumber} onChange={(e) => updateDirector({ docNumber: e.target.value })} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите серию и номер удостоверяющего документа." /></div>
            </div>
            <div className="relative">
              <input className={`${fieldClass(submitAttempted && missingRequiredFields.includes("director.issueDate"))} w-full pr-9`} type="date" value={form.director.issueDate} onChange={(e) => updateDirector({ issueDate: e.target.value })} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите дату выдачи документа." /></div>
            </div>
          </div>
          <div className="relative">
            <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("director.issueAuthority") ? "border-[#EF4444]" : ""}`} placeholder="Орган выдачи *" value={form.director.issueAuthority} onChange={(e) => updateDirector({ issueAuthority: e.target.value })} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Укажите орган, выдавший документ." /></div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Учредители и работники</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => setForm((p) => ({ ...p, workers: [...p.workers, emptyPerson()] }))}>+ Добавить сотрудника</button>
              <HelpTooltip text="Добавить нового работника в заявку." />
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => setForm((p) => ({ ...p, founders: [...p.founders, emptyPerson()] }))}>+ Добавить учредителя</button>
              <HelpTooltip text="Добавить учредителя в заявку." />
            </div>
          </div>
          <p className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Дополнительный блок. Для подачи заявки здесь заполнение не требуется.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Вид деятельности и профиль мероприятий *</h2>
          <div className="flex gap-4 text-sm">
            {[
              "Концерты",
              "Фестивали",
              "Театр",
              "Выставки",
            ].map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activities.includes(item)}
                  onChange={() =>
                    setForm((p) => ({
                      ...p,
                      activities: p.activities.includes(item) ? p.activities.filter((x) => x !== item) : [...p.activities, item],
                    }))
                  }
                />
                {item}
                <HelpTooltip text={item === "Концерты" ? "Выберите, если организатор проводит концерты." : item === "Фестивали" ? "Выберите, если организатор проводит фестивали." : item === "Театр" ? "Выберите, если организатор проводит театральные постановки." : "Выберите, если организатор проводит выставки."} />
              </label>
            ))}
          </div>
          <div className="relative">
            <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("activities") ? "border-[#EF4444]" : ""}`} placeholder="Иное" value={form.activityOther} onChange={(e) => setForm((p) => ({ ...p, activityOther: e.target.value }))} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Введите другой вид деятельности, если он не перечислен выше." /></div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Опыт проведения мероприятий</h2>
          <div className="relative">
            <textarea className="w-full min-h-24 rounded px-3 py-2 pr-9 bg-[#0F1620] border" placeholder="Описание" value={form.pastEventsDescription} onChange={(e) => setForm((p) => ({ ...p, pastEventsDescription: e.target.value }))} />
            <div className="absolute right-2 top-3"><HelpTooltip text="Опишите прошлые мероприятия, проведённые организатором." /></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addAttachment("past-video")}>Загрузить видеоотчёт</button>
              <HelpTooltip text="Добавить видеофайл с прошедшего мероприятия." />
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addAttachment("past-audio")}>Загрузить аудиозапись</button>
              <HelpTooltip text="Добавить аудиозапись с прошедшего мероприятия." />
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addAttachment("past-script")}>Загрузить сценарий</button>
              <HelpTooltip text="Добавить сценарий прошедшего мероприятия." />
            </div>
          </div>
          <p className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Дополнительный блок. Для подачи заявки здесь заполнение не требуется.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Документы</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addAttachment("registry-statement")}>Загрузить заявление</button>
              <HelpTooltip text="Прикрепить заявление для включения в реестр." />
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#1d2a3b]" onClick={() => addAttachment("registry-appendix")}>Загрузить приложение</button>
              <HelpTooltip text="Прикрепить приложение к заявлению." />
            </div>
            <div className="inline-flex items-center gap-1">
              <button className="px-3 py-2 rounded bg-[#2b3f57]" onClick={() => addAttachment("sample-registry", true)}>Скачать образец</button>
              <HelpTooltip text="Скачать образец заявления для заполнения." />
            </div>
          </div>
          <p className="text-xs" style={{ color: "rgba(245,247,250,0.65)" }}>Дополнительный блок. Для подачи заявки здесь заполнение не требуется.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Доступ в кабинет</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("accountCredentials.login") ? "border-[#EF4444]" : ""}`} placeholder="Желаемый логин *" value={form.accountCredentials.login} onChange={(e) => setForm((p) => ({ ...p, accountCredentials: { ...p.accountCredentials, login: e.target.value } }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Этот логин будет использоваться для входа в кабинет организатора." /></div>
            </div>
            <div className="relative">
              <input className={`h-10 w-full rounded px-3 pr-9 bg-[#0F1620] border ${submitAttempted && missingRequiredFields.includes("accountCredentials.password") ? "border-[#EF4444]" : ""}`} type="password" placeholder="Пароль *" value={form.accountCredentials.password} onChange={(e) => setForm((p) => ({ ...p, accountCredentials: { ...p.accountCredentials, password: e.target.value } }))} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><HelpTooltip text="Задайте пароль не короче шести символов для первого входа." /></div>
            </div>
          </div>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Подтверждение и отправка</h2>
          <label className={`flex items-center gap-2 ${submitAttempted && !form.confirmations.isAccurate ? "text-[#FCA5A5]" : ""}`}>
            <input type="checkbox" checked={form.confirmations.isAccurate} onChange={(e) => setForm((p) => ({ ...p, confirmations: { ...p.confirmations, isAccurate: e.target.checked } }))} />
            Подтверждаю достоверность сведений *
            <HelpTooltip text="Отметьте, что предоставленные сведения верны." />
          </label>
          <label className={`flex items-center gap-2 ${submitAttempted && !form.confirmations.adminReviewConsent ? "text-[#FCA5A5]" : ""}`}>
            <input type="checkbox" checked={form.confirmations.adminReviewConsent} onChange={(e) => setForm((p) => ({ ...p, confirmations: { ...p.confirmations, adminReviewConsent: e.target.checked } }))} />
            Согласен на рассмотрение заявки администратором *
            <HelpTooltip text="Отметьте, что согласны на обработку и проверку заявки администраторами." />
          </label>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <div className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded bg-[#2b3f57]" onClick={() => save(false)}>Сохранить черновик</button>
            <HelpTooltip text="Сохранить текущие данные без отправки на рассмотрение." />
          </div>
          <div className="inline-flex items-center gap-1">
            <button className="px-4 h-10 rounded font-semibold" style={{ background: "#F2C94C", color: "#111" }} onClick={() => save(true)}>Отправить заявку</button>
            <HelpTooltip text="Отправить текущую версию заявки в администрацию на проверку." />
          </div>
          <div className="inline-flex items-center gap-1">
            <Link to="/organizer/login" className="px-4 h-10 inline-flex items-center rounded border">Вернуться ко входу</Link>
            <HelpTooltip text="Вернуться на страницу входа организатора." />
          </div>
        </div>
      </div>
    </div>
  );
}
