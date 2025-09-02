import React from "react";
import moment from "moment";
import { Calendar as SmallCalendar } from "react-calendar";

const YearView = ({ date, onChange, onMonthClick }) => {
  const year = moment(date).year();
  const months = moment.months();

  return (
    <div className="year-view">
      {months.map((month, i) => (
        <div
          key={i}
          className="year-month"
          onClick={() => onMonthClick(moment([year, i, 1]).toDate())}
          style={{ cursor: "pointer" }}
        >
          <h4>{month}</h4>
          <SmallCalendar
            value={moment([year, i, 1]).toDate()}
            onChange={(val) => onChange(val)}
            showNeighboringMonth={false}
            tileDisabled={() => true}
          />
        </div>
      ))}
    </div>
  );
};

export default YearView;
