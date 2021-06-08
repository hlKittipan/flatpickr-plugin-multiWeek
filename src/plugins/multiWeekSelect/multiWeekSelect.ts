import { DayElement } from "../../types/instance";
import { Plugin } from "../../types/options";
import { getEventTarget } from "../../utils/dom";

export type MultiWeeks = {
  weekStartDay?: Date;
  weekEndDay?: Date;
  weekOption: number;
};

export interface MultiWeekConfig {
  week: Number;
  currentWeek: number;
}

const defaultWeekConfig: MultiWeekConfig = {
  week: 1,
  currentWeek: 1,
};

const DAY_IN_WEEK: number = 7;

function multiWeekSelectPlugin(
  pluginConfig?: MultiWeekConfig
): Plugin<MultiWeeks> {
  const weekConfig = { ...defaultWeekConfig, ...pluginConfig };

  return function (fp) {
    if (fp.config.noCalendar || fp.isMobile) return {};

    function onDayHover(event: MouseEvent) {
      const day = getEventTarget(event) as DayElement;
      if (!day.classList.contains("flatpickr-day")) return;

      const selectedWeekOptionValue: number = fp.weekOption || DAY_IN_WEEK;
      const days = fp.days.childNodes;
      const dayIndex = day.$i;

      const dayIndSeven = dayIndex / 7;
      const weekStartDay = (days[7 * Math.floor(dayIndSeven)] as DayElement)
        .dateObj;
      const weekEndDay = (days[
        7 * Math.ceil(dayIndSeven + 0.01) +
          (selectedWeekOptionValue - DAY_IN_WEEK) -
          1
      ] as DayElement).dateObj;

      for (let i = days.length; i--; ) {
        const day = days[i] as DayElement;
        const date = day.dateObj;
        if (date > weekEndDay || date < weekStartDay)
          day.classList.remove("inRange");
        else day.classList.add("inRange");
      }
    }

    function highlightWeek() {
      const selDate = fp.latestSelectedDateObj;
      if (
        selDate !== undefined &&
        selDate.getMonth() === fp.currentMonth &&
        selDate.getFullYear() === fp.currentYear
      ) {
        const selectedWeekOptionValue: number = fp.weekOption || DAY_IN_WEEK;
        fp.weekStartDay = (fp.days.childNodes[
          7 * Math.floor((fp.selectedDateElem as DayElement).$i / 7)
        ] as DayElement).dateObj;
        fp.weekEndDay = (fp.days.childNodes[
          7 * Math.ceil((fp.selectedDateElem as DayElement).$i / 7 + 0.01) +
            (selectedWeekOptionValue - DAY_IN_WEEK) -
            1
        ] as DayElement).dateObj;
      }
      const days = fp.days.childNodes;
      if (!fp.weekStartDay || !fp.weekEndDay) {
        return;
      }
      for (let i = days.length; i--; ) {
        const date = (days[i] as DayElement).dateObj;
        if (date >= fp.weekStartDay && date <= fp.weekEndDay)
          (days[i] as DayElement).classList.add("week", "selected");
      }
    }

    function onWeekOptionSelect(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      const eventTarget = getEventTarget(e);
      const selectedValue =
        (<HTMLInputElement>eventTarget).value || `${DAY_IN_WEEK}`;
      fp.weekOption = parseInt(selectedValue);
    }

    function clearHover() {
      const days = fp.days.childNodes;
      for (let i = days.length; i--; )
        (days[i] as Element).classList.remove("inRange");
    }

    function onReady() {
      if (fp.innerContainer) {
        const noticeContainer = fp._createElement<HTMLDivElement>(
          "div",
          "flatpickr-multiWeek-notice",
          "All charters start and finish on Saturdays"
        );
        fp.calendarContainer.insertBefore(noticeContainer, fp.innerContainer);
      }

      const weekOptionDropdownContainer = fp._createElement<HTMLSelectElement>(
        "select",
        "flatpickr-multiWeek-weekSelect"
      );

      for (let index = 1; index <= weekConfig.week; index++) {
        const optionElement = fp._createElement<HTMLOptionElement>(
          "option",
          "flatpickr-multiWeek-weekOption"
        );
        const optionValue = `${index * DAY_IN_WEEK}`;
        optionElement.value = optionValue;
        optionElement.text = optionValue;
        if (index == weekConfig.currentWeek) {
          optionElement.selected = true;
          let selectedWeek: number = weekConfig.currentWeek;
          fp.weekOption = selectedWeek * 7;
        }
        weekOptionDropdownContainer.appendChild(optionElement);
      }
      weekOptionDropdownContainer.addEventListener(
        "change",
        onWeekOptionSelect
      );

      fp.monthNav.childNodes[1].childNodes[0].appendChild(
        weekOptionDropdownContainer
      );

      if (fp.daysContainer !== undefined)
        fp.daysContainer.addEventListener("mouseover", onDayHover);
    }

    function onDestroy() {
      if (fp.daysContainer !== undefined)
        fp.daysContainer.removeEventListener("mouseover", onDayHover);
    }

    return {
      onValueUpdate: highlightWeek,
      onMonthChange: highlightWeek,
      onYearChange: highlightWeek,
      onOpen: highlightWeek,
      onClose: clearHover,
      onReady: [onReady, highlightWeek],
      onDestroy,
    };
  };
}

export default multiWeekSelectPlugin;
