import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import CalendarMini from "react-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-calendar/dist/Calendar.css";
import { io } from "socket.io-client";
import "./calender.css";

const localizer = momentLocalizer(moment);
const BACKEND = "https://26e2b6f8-4ec3-4832-ae51-db31c1a5b1bc-00-141z0r56gosoi.sisko.replit.dev";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ _id: "", title: "", description: "", location: "", type: "event", color: "#1a73e8", guests: "" });
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [currentView, setCurrentView] = useState(Views.WEEK);
  const [miniDate, setMiniDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [filters, setFilters] = useState({
    personal: true,
    birthdays: true,
    tasks: true,
    holidays: true,
  });
// Put this near the top, inside the component, before you use accessToken
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("access_token");
  const userInfo = params.get("user");

  if (token && userInfo) {
    const userObj = JSON.parse(decodeURIComponent(userInfo));
    setAccessToken(token);
    setUser(userObj);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(userObj));
    // clean the URL
    window.history.replaceState({}, document.title, "/");
  } else {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }
}, []);

// ✅ define fetchEvents once
const fetchEvents = async () => {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const res = await axios.get(`${BACKEND}/api/events`, { headers });

    const allEvents = res.data.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      color: e.color || "#1a73e8"
    }));

    setEvents(allEvents);
  } catch (err) {
    console.error("Fetch events error:", err);
  }
};

// fetch events when accessToken changes
useEffect(() => {
  fetchEvents();
}, [accessToken]);

// socket.io real-time updates
useEffect(() => {
  const socket = io(BACKEND);

  socket.on("calendarUpdate", () => {
    console.log("🔔 Calendar updated → refetching events...");
    fetchEvents();
  });

  return () => socket.disconnect();
}, []);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setForm({ _id: "", title: "", description: "", location: "", type: "event", color: "#1a73e8", guests: "" });
  };

  const handleSelectEvent = (event) => {
    setSelectedSlot({ start: event.start, end: event.end });
    setForm({ ...event });
  };

  const handleSaveEvent = async (ev) => {
    ev.preventDefault();
    if (!selectedSlot) return;

    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      type: form.type,
      color: form.color,
      guests: form.guests,
      start: selectedSlot.start.toISOString(),
      end: selectedSlot.end.toISOString(),
    };

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(`${BACKEND}/api/events`, payload, { headers });
      const savedEvent = res.data;

      setEvents([...events, { ...savedEvent, start: new Date(savedEvent.start), end: new Date(savedEvent.end) }]);
      setSelectedSlot(null);
      setForm({ _id: "", title: "", description: "", location: "", type: "event", color: "#1a73e8", guests: "" });
    } catch (err) {
      console.error("Save event error:", err);
    }
  };



const handleDeleteEvent = async () => {
  if (!form._id) return;

  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.delete(`${BACKEND}/api/events/${form._id}`, { headers });

    // Remove locally and refresh
    fetchEvents(); // refresh all events after delete
    setSelectedSlot(null);
    setForm({ _id: "", title: "", description: "", location: "", type: "event", color: "#1a73e8", guests: "" });
  } catch (err) {
    console.error("Delete event error:", err);
  }
};

// Add a refresh button somewhere in your JSX
<button className="refresh-btn" onClick={fetchEvents}>🔄 Refresh</button>



  const filteredEvents = events.filter(e => {
    if (e.type === "personal" && !filters.personal) return false;
    if (e.type === "birthday" && !filters.birthdays) return false;
    if (e.type === "task" && !filters.tasks) return false;
    if (e.type === "holiday" && !filters.holidays) return false;
    return true;
  });

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={() => onNavigate("TODAY")} className="today-btn">Today</button>
        <button onClick={() => onNavigate("PREV")} className="nav-btn">◀</button>
        <button onClick={() => onNavigate("NEXT")} className="nav-btn">▶</button>
        <span className="month-label">{label}</span>
      </div>
      <div className="toolbar-right">
        <select onChange={(e) => onView(e.target.value)} value={currentView} className="view-switch">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="calendar-wrapper">
      <header className="header">
        <div className="header-left">
          <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="Logo" className="logo" />
          <h1>Calendar</h1>
        </div>
        <div className="header-right">{user && <img src={user.picture} alt={user.name} className="profile-img" />}</div>
      </header>

      <div className="content">
        <aside className="sidebar">
          <button className="create-btn">+ Create</button>
          <CalendarMini
            value={miniDate}
            onChange={(date) => {
              setMiniDate(date);
              setCalendarDate(date);
              setCurrentView(Views.WEEK);
            }}
          />

          <div className="cal-section">
            <h4>My calendars</h4>
            <label><input type="checkbox" checked={filters.personal} onChange={() => setFilters({ ...filters, personal: !filters.personal })} /> Personal</label>
            <label><input type="checkbox" checked={filters.birthdays} onChange={() => setFilters({ ...filters, birthdays: !filters.birthdays })} /> Birthdays</label>
            <label><input type="checkbox" checked={filters.tasks} onChange={() => setFilters({ ...filters, tasks: !filters.tasks })} /> Tasks</label>
          </div>

          <div className="cal-section">
            <h4>Other calendars</h4>
            <label><input type="checkbox" checked={filters.holidays} onChange={() => setFilters({ ...filters, holidays: !filters.holidays })} /> Holidays</label>
          </div>
        </aside>

        <main className="main">
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            date={calendarDate}
            onNavigate={setCalendarDate}
            selectable
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={setCurrentView}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            components={{ toolbar: CustomToolbar }}
            eventPropGetter={(event) => ({ style: { backgroundColor: event.color || "#1a73e8", color: "white", borderRadius: 6 } })}
          />
        </main>
      </div>

      {selectedSlot && (
        <div className="event-popup" style={{ "--popup-top": `${selectedSlot.box?.y || 100}px`, "--popup-left": `${selectedSlot.box?.x || 100}px` }}>
          <div className="event-popup-header">{form._id ? "Edit Event" : "Add Event"}</div>
          <div className="event-popup-body">
            <input type="text" placeholder="Add title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <div className="datetime-row">
              <input type="date" value={moment(selectedSlot.start).format("YYYY-MM-DD")}
                     onChange={e => setSelectedSlot({
                       ...selectedSlot,
                       start: new Date(e.target.value + "T" + moment(selectedSlot.start).format("HH:mm")),
                       end: new Date(e.target.value + "T" + moment(selectedSlot.end).format("HH:mm"))
                     })} />
              <input type="time" value={moment(selectedSlot.start).format("HH:mm")}
                     onChange={e => setSelectedSlot({
                       ...selectedSlot,
                       start: new Date(moment(selectedSlot.start).format("YYYY-MM-DD") + "T" + e.target.value),
                       end: selectedSlot.end
                     })} />
              <span>–</span>
              <input type="time" value={moment(selectedSlot.end).format("HH:mm")}
                     onChange={e => setSelectedSlot({
                       ...selectedSlot,
                       end: new Date(moment(selectedSlot.end).format("YYYY-MM-DD") + "T" + e.target.value),
                       start: selectedSlot.start
                     })} />
            </div>
            <input type="text" placeholder="Add guests" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} />
            <input type="text" placeholder="Add location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <textarea placeholder="Add description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="event-popup-footer">
            <div className="actions">
              <button className="cancel" onClick={() => setSelectedSlot(null)}>Cancel</button>
              {form._id && <button className="delete" onClick={handleDeleteEvent}>Delete</button>}
              <button className="save" onClick={handleSaveEvent}>Save</button>
            </div>
          </div>
        </div>
      )}

      <button className="google-btn" onClick={() => window.location.href = `${BACKEND}/api/auth/google`}>Connect Google Calendar</button>
    </div>
  );
};

export default Calendar;
