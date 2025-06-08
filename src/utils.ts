import { config } from "./config.js";

function formatUrl(url: string): string {
    const obj = new URL(url);
    return (obj.origin.split('https://')[1] + '/');
}

function formatSearch(search: string): string {
    return (search.replaceAll(' ', '+'));
}

function formatSearchUrl(search: string): string {
    const url = new URL(config.search_engine + '/search');

    url.searchParams.append("q", search);
    url.searchParams.append("oq", search);
    url.searchParams.append("sourceid", "chrome");
    url.searchParams.append("ie", "UTF-8");
    url.searchParams.append("safe", "active");
    url.searchParams.append("ssui", "on");

    return formatUrl(url.href);
}

export function generateBlockedUrl(
    email: string,
    reportUrl: string,
    ip: string
): string {
    if (!email || !reportUrl || !ip) {
        throw new Error("Missing required fields for /api/site");
    }

    const url = new URL(config.cluster + '/blocked');

    url.searchParams.append("useremail", email);
    url.searchParams.append("reason", "domainblockedforuser");
    // url.searchParams.append("categoryid", "");
    url.searchParams.append("policyid", "");
    url.searchParams.append("keyword", "");
    url.searchParams.append("url", btoa(formatUrl(reportUrl)));
    url.searchParams.append("ver", "-");
    url.searchParams.append("extension_id", config.extenion_id);
    url.searchParams.append("extension_version", config.extension_version);
    url.searchParams.append("internal_ip", ip);

    return url.href;
}

export function generateBlockedKeyword(
    email: string,
    keyword: string,
    ip: string
): string {
        if (!email || !keyword || !ip) {
        throw new Error("Missing required fields for /api/site");
    }

    const url = new URL(config.cluster + '/blocked');

    url.searchParams.append("useremail", email);
    url.searchParams.append("reason", "safesearch");
    url.searchParams.append("categoryid", "6786585601");
    url.searchParams.append("policyid", "");
    url.searchParams.append("keyword", btoa(formatSearch(keyword)));
    url.searchParams.append("url", btoa(formatSearchUrl(formatSearch(keyword))));
    url.searchParams.append("ver", "-");
    url.searchParams.append("extension_id", config.extenion_id);
    url.searchParams.append("extension_version", config.extension_version);
    url.searchParams.append("internal_ip", ip);

    return url.href;
}
