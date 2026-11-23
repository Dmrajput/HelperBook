import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/api/publicApi";
import { SITE } from "@/config/site";

function preferApi(apiValue, fallback) {
  const fromApi = String(apiValue ?? "").trim();
  if (fromApi) return fromApi;
  return String(fallback ?? "").trim();
}

export function usePlatform() {
  const query = useQuery({
    queryKey: ["public", "platform"],
    queryFn: publicApi.platform,
    staleTime: 5 * 60 * 1000,
  });

  const data = query.data;

  const contact = {
    productName: preferApi(data?.productName, SITE.productName),
    legalCompanyName: preferApi(data?.legalCompanyName, SITE.legalCompanyName),
    companyDescription: preferApi(data?.companyDescription, SITE.description),
    contactEmail: preferApi(data?.supportEmail, SITE.contactEmail),
    contactPhone: preferApi(data?.supportPhone, SITE.contactPhone),
    supportHours: preferApi(data?.supportHours, SITE.supportHours),
    address: preferApi(data?.address, SITE.address),
    whatsappNumber: preferApi(data?.whatsappNumber, SITE.whatsappNumber),
    appDownloadUrl: preferApi(data?.appDownloadUrl, SITE.appDownloadUrl),
    loginUrl: preferApi(data?.loginUrl, SITE.loginUrl),
    privacyPolicyVersion: preferApi(data?.privacyPolicyVersion, SITE.privacyPolicyVersion),
    reportingTimezone: preferApi(data?.reportingTimezone, SITE.reportingTimezone),
    websiteUrl: preferApi(data?.websiteUrl, SITE.siteUrl),
    maintenanceBanner: String(data?.maintenanceBanner ?? "").trim(),
  };

  return {
    ...query,
    contact,
  };
}