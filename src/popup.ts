import Chart from "chart.js/auto";
import "./style.scss";

document.addEventListener("DOMContentLoaded", () => {
  localizeElements();
  checkUrlAndLoadData();
});

document.querySelectorAll(".period-btn").forEach((element) => {
  element.addEventListener(`change`, () => {
    updateUIForLoading(true);
    checkUrlAndLoadData();
  });
});

async function checkUrlAndLoadData(): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;
  if (!url || isNotSupportPage(url)) {
    displayUnsupportedMessage();
    updateUIForLoading(false);

    hideInfoHeaders();
    return;
  }
  const p = getCheckedPeriod();
  await loadData(url, p);
}

type RankEntry = {
  rank: number;
  date: string;
};

type RankData = {
  ranks: RankEntry[];
  domain: string;
};

async function loadData(tabUrl: string, period: string): Promise<void> {
  try {
    const hostname = new URL(tabUrl).hostname;
    const domain = hostname.match(/^(?:.*?\.)?([a-zA-Z0-9\-_]{3,}\.(?:\w{2,8}|\w{2,4}\.\w{2,4}))$/)![1];

    const url = getTargetUrl(domain, period);

    const response = await fetch(url);
    if (response.status === 404) {
      hideInfoHeaders();
      updateUIForLoading(false);
      displayNotFoundMessage(domain);
      return;
    }

    if (!response.ok) {
      console.error(response.status);
      console.error(response.body);
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    updateUIForLoading(false);

    displayRankingInfo(data as RankData);
    drawGraph(data.ranks);
  } catch (error) {
    updateUIForLoading(false);
    hideInfoHeaders();
    displayErrorMessage();
    console.error("Failed to load ranking information", error);
  }
}

function drawGraph(data: RankEntry[]): void {
  const ctx = <HTMLCanvasElement>document.getElementById("ranking-chart")!;
  const chart = Chart.getChart("ranking-chart");
  if (chart != null) {
    chart.destroy();
  }

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((it) => it.date),
      datasets: [
        {
          label: chrome.i18n.getMessage("rank"),
          data: data.map((it) => it.rank),
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      layout: {
        padding: 5,
      },
      scales: {
        x: { reverse: true },
        y: {
          reverse: true,
          beginAtZero: false,
          ticks: { precision: 0 },
          grace: 1,
        },
      },
    },
  });
}

function getCheckedPeriod(): string {
  const checkedElement = document.querySelector<HTMLInputElement>(`input[type='radio'][name='period-radio']:checked`);
  return checkedElement ? checkedElement.id : "monthly";
}

function getTargetUrl(domain: string, period: string): string {
  const apiUrl = "https://ranking-api.kyokko.work/api/v1/rankings";

  if (period === "daily") {
    return `${apiUrl}/daily?domain=${domain}&start_date=${getDateMonthsAgo(2)}&end_date=${getToday()}`;
  } else {
    return `${apiUrl}/monthly?domain=${domain}&start_month=${get50MonthsAgoDate()}&end_month=${getLastMonth()}`;
  }
}

function isNotSupportPage(url: string): boolean {
  return !url.startsWith("http") || url.includes("chrome.google.com/webstore") || url.includes("addons.mozilla.org");
}

function displayUnsupportedMessage() {
  document.getElementById("unsupported-page")!.classList.remove("d-none");
}

function updateUIForLoading(isLoading: boolean) {
  const loadings = document.querySelectorAll<HTMLElement>(".loading");

  if (isLoading) {
    updateRankingInfoVisibility(true);

    loadings.forEach((element) => {
      element.classList.remove("d-none");
    });
  } else {
    updateRankingInfoVisibility(false);
    loadings.forEach((element) => {
      element.classList.add("d-none");
    });
  }
}

function updateRankingInfoVisibility(isHidden: boolean) {
  if (isHidden) {
    document.getElementById("current-rank")!.classList.add("d-none");
    document.getElementById("chart-container")!.classList.add("d-none");
  } else {
    document.getElementById("current-rank")!.classList.remove("d-none");
    document.getElementById("chart-container")!.classList.remove("d-none");
  }
}

function hideInfoHeaders() {
  document.getElementById("ranking-info")!.classList.add("d-none");
  document.getElementById("graph-container")!.classList.add("d-none");
}

function displayNotFoundMessage(domain: string) {
  document.getElementById("not-found")!.textContent = chrome.i18n.getMessage("notFoundError", domain);
  document.getElementById("not-found")!.classList.remove("d-none");
}

function displayErrorMessage() {
  document.getElementById("error")!.classList.remove("d-none");
}

function displayRankingInfo(data: RankData) {
  document.getElementById("rank-url")!.textContent = data.domain;
  document.getElementById("rank-number")!.textContent = `${chrome.i18n.getMessage("rank")}: #${data.ranks[0].rank}`;
  updateRankingInfoVisibility(false);
}

function getToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * get last month end date
 * @returns formatted date
 */
function getLastMonth(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const lastDayOfPreviousMonth = new Date(year, month, 0);

  return `${lastDayOfPreviousMonth.getFullYear()}-${String(lastDayOfPreviousMonth.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * get end of the month 50 months prior
 * @returns formatted date
 */
function get50MonthsAgoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const pastMonth = new Date(year, month - 50, 0);
  return `${pastMonth.getFullYear()}-${String(pastMonth.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calculates the date 'monthsAgo' months before the current date and returns it in YYYY-MM-DD format.
 *
 * @param {number} monthsAgo - The number of months to go back from the current date.
 * @returns {string} A string representing the date 'monthsAgo' months before today, formatted as YYYY-MM-DD.
 */
function getDateMonthsAgo(monthsAgo: number): string {
  const today = new Date();
  today.setMonth(today.getMonth() - monthsAgo);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Localizes the text content of all elements with the 'localize' class based on their 'data-localize' attribute.
 */
function localizeElements(): void {
  if (chrome.i18n.getUILanguage() === "ja") {
    document.querySelector("html")?.setAttribute("lang", chrome.i18n.getUILanguage());
  }

  const elements: NodeListOf<HTMLElement> = document.querySelectorAll(".localize");

  elements.forEach((item: HTMLElement) => {
    const localizeKey = item.dataset.localize;

    if (localizeKey) {
      item.innerHTML = chrome.i18n.getMessage(localizeKey);
    }
  });
}
