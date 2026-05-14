import { useEffect, useState } from "react";
import { Clock, MapPin, BookOpen } from "lucide-react";
import { apiUrl } from "../utils/api";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const colorClasses = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-pink-600",
  "bg-orange-500",
  "bg-indigo-600",
];

interface ScheduleItem {
  id: string;
  day: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  course: string;
  code: string;
  room: string;
  instructor: string;
  credits: number;
  color: string;
}

function parseTimeToMinutes(value: string) {
  const [hourRaw, minuteRaw = "0"] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  return hour * 60 + minute;
}

function parseSchedule(schedule: string) {
  const match = schedule?.match(/^([A-Za-z]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);

  if (!match) {
    return { dayIndexes: [], startMinutes: 9 * 60, endMinutes: 10 * 60 };
  }

  const [, dayPart, start, end] = match;

  const dayMap: Record<string, number[]> = {
    M: [0],
    T: [1],
    W: [2],
    Th: [3],
    F: [4],
    MW: [0, 2],
    MWF: [0, 2, 4],
    TR: [1, 3],
    TTh: [1, 3],
  };

  return {
    dayIndexes: dayMap[dayPart] || [],
    startMinutes: parseTimeToMinutes(start),
    endMinutes: parseTimeToMinutes(end),
  };
}

function formatTime(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteText = minute < 10 ? `0${minute}` : `${minute}`;

  return `${hour12}:${minuteText} ${suffix}`;
}
export function MySchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const studentId = localStorage.getItem("studentId") || "1";
        const response = await fetch(apiUrl(`/registration/student/${studentId}`));
        const data = await response.json();

        const mapped: ScheduleItem[] = [];

        (data || [])
          .filter((enrollment: any) => enrollment.status === "enrolled")
          .forEach((enrollment: any, index: number) => {
            const section = enrollment.section;
            const course = section?.course;
            const parsed = parseSchedule(section?.schedule || "");

            parsed.dayIndexes.forEach((day) => {
              mapped.push({
                id: `${enrollment.enrollment_id}-${day}`,
                day,
                startHour: Math.floor(parsed.startMinutes / 60),
                startMinute: parsed.startMinutes % 60,
                endHour: Math.floor(parsed.endMinutes / 60),
                endMinute: parsed.endMinutes % 60,
                course: course?.course_name || "Unknown Course",
                code: course?.course_code || `Section ${section?.section_id}`,
                room: section?.room || "TBA",
                instructor: section?.instructor_id ? `Instructor ${section.instructor_id}` : "Instructor TBA",
                credits: Number(course?.credits ?? 0),
                color: colorClasses[index % colorClasses.length],
              });
            });
          });

        setSchedule(mapped);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

const uniqueCourses = schedule.filter(
  (item, index, self) =>
    index === self.findIndex((course) => course.code === item.code)
);

  const startDayMinutes = 8 * 60;
  const endDayMinutes = 18 * 60;
  const pixelsPerMinute = 1.15;
  const calendarHeight = (endDayMinutes - startDayMinutes) * pixelsPerMinute;

const hourRows: number[] = [];

for (let hour = 8; hour <= 18; hour++) {
  hourRows.push(hour * 60);
}

  if (loading) {
    return <div className="p-8 text-gray-600">Loading schedule from backend...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">My Schedule</h1>
            <p className="text-gray-600">Backend-loaded weekly timetable for enrolled courses</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs text-gray-500">Courses</p>
              <p className="text-xl font-semibold text-gray-900">{uniqueCourses.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs text-gray-500">Weekly Blocks</p>
              <p className="text-xl font-semibold text-gray-900">{schedule.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs text-gray-500">Credits</p>
              <p className="text-xl font-semibold text-gray-900">
                {uniqueCourses.reduce((sum, item) => sum + item.credits, 0)}
              </p>
            </div>
          </div>
        </div>

        {schedule.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl text-gray-900 font-semibold mb-2">No enrolled courses found</h2>
            <p className="text-gray-600">Register for courses first, then your weekly schedule will appear here.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-[90px_repeat(5,1fr)] border-b border-gray-200 bg-gray-50">
                <div className="p-4 text-sm text-gray-500 font-medium">Time</div>
                {days.map((day) => (
                  <div key={day} className="p-4 text-center border-l border-gray-200">
                    <p className="font-semibold text-gray-900">{day}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[90px_repeat(5,1fr)] relative" style={{ height: `${calendarHeight}px` }}>
                <div className="relative bg-gray-50 border-r border-gray-200">
                  {hourRows.map((minutes) => (
                    <div
                      key={minutes}
                      className="absolute left-0 right-0 px-3 text-xs text-gray-500"
                      style={{ top: `${(minutes - startDayMinutes) * pixelsPerMinute - 8}px` }}
                    >
                      {formatTime(minutes)}
                    </div>
                  ))}
                </div>

                {days.map((day, dayIndex) => (
                  <div key={day} className="relative border-l border-gray-200">
                    {hourRows.map((minutes) => (
                      <div
                        key={minutes}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: `${(minutes - startDayMinutes) * pixelsPerMinute}px` }}
                      />
                    ))}

                    {schedule
                      .filter((item) => item.day === dayIndex)
                      .map((item) => {
                        const startMinutes = item.startHour * 60 + item.startMinute;
                        const endMinutes = item.endHour * 60 + item.endMinute;
                        const top = (startMinutes - startDayMinutes) * pixelsPerMinute;
                        const height = Math.max((endMinutes - startMinutes) * pixelsPerMinute, 52);

                        return (
                          <div
                            key={item.id}
                            className={`absolute left-2 right-2 ${item.color} text-white rounded-xl p-3 shadow-md overflow-hidden`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold leading-tight">{item.code}</p>
                                <p className="text-xs opacity-95 leading-tight mt-1">{item.course}</p>
                              </div>
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] opacity-95">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(startMinutes)} - {formatTime(endMinutes)}
                              </p>
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.room}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueCourses.map((item) => (
                <div key={item.code} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-12 rounded-full ${item.color}`} />
                    <div>
                      <p className="font-semibold text-gray-900">{item.code}</p>
                      <p className="text-sm text-gray-600">{item.course}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.room} • {item.instructor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}