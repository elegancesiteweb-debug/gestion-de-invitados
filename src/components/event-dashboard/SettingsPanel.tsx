import type { AccountType, Event, SatisfactionSurvey } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  updateEventSettings,
  toggleGeneralRsvp,
  toggleClientPortal,
  toggleEventCalendar,
  updateEventStatus,
  uploadEventLogo,
  removeEventLogo,
} from "@/lib/actions/events";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { TemplateEditor } from "@/components/event-dashboard/TemplateEditor";
import { GeneralPassesInput } from "@/components/event-dashboard/GeneralPassesInput";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { EmbedCodeButton } from "@/components/EmbedCodeButton";
import { hasFeature } from "@/lib/features";

export async function SettingsPanel({
  event,
  baseUrl,
  accountType,
  satisfactionSurvey,
}: {
  event: Event;
  baseUrl: string;
  accountType: AccountType;
  satisfactionSurvey: SatisfactionSurvey | null;
}) {
  const t = await getTranslations("eventSettings");
  const STATUS_LABELS: Record<string, string> = {
    PLANNING: t("statusPlanning"),
    CONFIRMED: t("statusConfirmed"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const generalUrl = event.publicRsvpToken ? `${baseUrl}/g/${event.publicRsvpToken}` : null;
  const portalUrl = event.clientPortalToken ? `${baseUrl}/portal/${event.clientPortalToken}` : null;
  const calendarUrl = event.calendarToken ? `${baseUrl}/api/calendar/${event.calendarToken}` : null;
  const webcalUrl = event.calendarToken
    ? `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/calendar/${event.calendarToken}`
    : null;

  return (
    <div className="space-y-6 py-6">
      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("eventStatus")}</h2>
        <form
          action={updateEventStatus.bind(null, event.id)}
          className="mt-2 flex flex-wrap items-center gap-3"
        >
          <select
            name="status"
            defaultValue={event.status}
            className="rounded-lg border border-gold/25 bg-white/70 px-3 py-1.5 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
          >
            {t("updateStatus")}
          </button>
        </form>
      </div>

      <form
        action={updateEventSettings.bind(null, event.id)}
        className="space-y-4 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
      >
        <div>
          <h2 className="font-serif text-lg font-medium text-ink">{t("invitationMessage")}</h2>
          <p className="text-xs text-ink-muted">{t("invitationMessageHint")}</p>
        </div>

        <TemplateEditor initialTemplate={event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE} />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showTableOnRsvp" defaultChecked={event.showTableOnRsvp} />
            {t("showTableOnRsvp")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="askDietaryOnRsvp" defaultChecked={event.askDietaryOnRsvp} />
            {t("askDietaryOnRsvp")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="askMessageOnRsvp" defaultChecked={event.askMessageOnRsvp} />
            {t("askMessageOnRsvp")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="askCompanionNamesOnRsvp"
              defaultChecked={event.askCompanionNamesOnRsvp}
            />
            {t("askCompanionNamesOnRsvp")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showQrOnConfirmation"
              defaultChecked={event.showQrOnConfirmation}
            />
            {t("showQrOnConfirmation")}
          </label>
        </div>

        <GeneralPassesInput initialValue={event.generalMaxCompanions} />

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">{t("invitationLinkTitle")}</h3>
          <p className="text-xs text-ink-muted">
            {t("invitationLinkHint")} {"{invitacion}"} {t("invitationLinkHint2")}
          </p>
          <input
            name="invitationLinkUrl"
            type="url"
            defaultValue={event.invitationLinkUrl ?? ""}
            placeholder="https://www.canva.com/design/..."
            className="mt-2 w-full rounded-lg border border-gold/25 bg-white/70 px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-gold/15 pt-4">
          <h3 className="font-serif text-base font-medium text-ink">{t("remindersTitle")}</h3>
          <p className="text-xs text-ink-muted">{t("remindersHint")}</p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            {t("remindAfter")}
            <input
              type="number"
              name="reminderDaysAfter"
              min={1}
              defaultValue={event.reminderDaysAfter ?? ""}
              className="w-16 rounded-lg border border-gold/25 bg-white/70 px-2 py-1 text-sm"
            />
            {t("daysSinceInvitation")}
          </label>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          {t("save")}
        </button>
      </form>

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("eventLogoTitle")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("eventLogoHint")}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {event.logoImageType && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/events/${event.id}/logo`}
                alt=""
                className="h-20 w-20 rounded-lg object-cover"
              />
              <form action={removeEventLogo.bind(null, event.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
                >
                  {t("remove")}
                </button>
              </form>
            </>
          )}
          <form action={uploadEventLogo.bind(null, event.id)} className="flex items-center gap-2">
            <input type="file" name="logo" accept="image/*" required className="text-sm" />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("upload")}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("generalFormTitle")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("generalFormHint")}</p>

        <div className="mt-3 flex items-center gap-3">
          {event.publicRsvpToken ? (
            <form action={toggleGeneralRsvp.bind(null, event.id)}>
              <input type="hidden" name="enable" value="false" />
              <button
                type="submit"
                className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
              >
                {t("deactivateGeneralForm")}
              </button>
            </form>
          ) : (
            <form action={toggleGeneralRsvp.bind(null, event.id)}>
              <input type="hidden" name="enable" value="true" />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
              >
                {t("activateGeneralForm")}
              </button>
            </form>
          )}
        </div>

        {generalUrl && (
          <div className="mt-4 flex items-center gap-4 border-t border-gold/15 pt-4">
            <CopyLinkButton url={generalUrl} />
            <EmbedCodeButton url={generalUrl} title={`${t("embedTitlePrefix")} - ${event.title}`} />
          </div>
        )}
      </div>

      {hasFeature(accountType, "client_portal") && (
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <h2 className="font-serif text-lg font-medium text-ink">{t("clientPortalTitle")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{t("clientPortalHint")}</p>

          <div className="mt-3 flex items-center gap-3">
            {event.clientPortalToken ? (
              <form action={toggleClientPortal.bind(null, event.id)}>
                <input type="hidden" name="enable" value="false" />
                <button
                  type="submit"
                  className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
                >
                  {t("deactivateClientPortal")}
                </button>
              </form>
            ) : (
              <form action={toggleClientPortal.bind(null, event.id)}>
                <input type="hidden" name="enable" value="true" />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
                >
                  {t("activateClientPortal")}
                </button>
              </form>
            )}
          </div>

          {portalUrl && (
            <div className="mt-4 flex items-center gap-4 border-t border-gold/15 pt-4">
              <CopyLinkButton url={portalUrl} />
            </div>
          )}

          {satisfactionSurvey && (
            <div className="mt-4 border-t border-gold/15 pt-4">
              <p className="text-sm font-medium text-ink">{t("satisfactionTitle")}</p>
              <p className="mt-1 text-sm text-ink">
                {t("satisfactionRatingLine", { rating: satisfactionSurvey.rating })}
                {satisfactionSurvey.wouldRecommend != null && (
                  <span className="ml-2 text-ink-muted">
                    {satisfactionSurvey.wouldRecommend ? t("satisfactionWouldRecommend") : t("satisfactionWouldNotRecommend")}
                  </span>
                )}
              </p>
              {satisfactionSurvey.comments && (
                <p className="mt-1 text-sm italic text-ink-muted">“{satisfactionSurvey.comments}”</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("deviceCalendarTitle")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("deviceCalendarHint")}</p>

        <div className="mt-3 flex items-center gap-3">
          {event.calendarToken ? (
            <form action={toggleEventCalendar.bind(null, event.id)}>
              <input type="hidden" name="enable" value="false" />
              <button
                type="submit"
                className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
              >
                {t("deactivateCalendar")}
              </button>
            </form>
          ) : (
            <form action={toggleEventCalendar.bind(null, event.id)}>
              <input type="hidden" name="enable" value="true" />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
              >
                {t("activateCalendar")}
              </button>
            </form>
          )}
        </div>

        {calendarUrl && webcalUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gold/15 pt-4">
            <a href={calendarUrl} className="text-sm text-gold-dark hover:underline">
              {t("downloadIcs")}
            </a>
            <a href={webcalUrl} className="text-sm text-gold-dark hover:underline">
              {t("subscribeWebcal")}
            </a>
            <CopyLinkButton url={calendarUrl} label={t("copyLink")} />
          </div>
        )}
      </div>
    </div>
  );
}
