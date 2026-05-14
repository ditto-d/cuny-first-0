import { useEffect, useState } from "react";
import { apiUrl } from "../utils/api";

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface ScheduleItem {
  day: number;
  startTime: number;
  duration: number;
  course: string;
  code: string;
  room: string;
  color: string;
}

const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"];

function parseSchedule(schedule: string) {
  const dayMap: Record<string, number[]> = {
    M: [0],
    T: [1],
    W: [2],
    Th: [3],
    F: [4],
    MWF: [0, 2, 4],
    TTh: [1, 3],
  };

  const parts = schedule?.split(" ") || [];
  const dayPart = parts[0];
  const timePart = parts[1];

  const dayIndexes = dayMap[dayPart] || [];

  let startIndex = 1;
  if (timePart) {
    const hour = parseInt(timePart.split(":")[0]);
    if (!isNaN(hour)) {
      startIndex = Math.max(0, hour - 8);
    }
  }

  return { dayIndexes, startIndex };
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

        data
          .filter((enrollment: any) => enrollment.status === "enrolled")
          .forEach((enrollment: any, index: number) => {
            const section = enrollment.section;
            const course = section?.course;

            const parsed = parseSchedule(section?.schedule || "");

            parsed.dayIndexes.forEach((day) => {
              mapped.push({
                day,
                startTime: parsed.startIndex,
                duration: 1,
                course: course?.course_name || "Unknown Course",
                code: course?.course_code || `Section ${section?.section_id}`,
                room: section?.room || "TBA",
                color: colors[index % colors.length],
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

  const uniqueCourses = Array.from(
    new Map(schedule.map((item) => [item.code, item])).values()
  );

  if (loading) {
    return <div className="p-8 text-gray-600">Loading schedule...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">Current Weekly Timetable</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 border-b border-gray-200">
                <div className="p-4 bg-gray-50"></div>
                {days.map((day) => (
                  <div key={day} className="p-4 text-center bg-gray-50 border-l border-gray-200">
                    <p className="text-gray-900">{day}</p>
                  </div>
                ))}
              </div>

              <div className="relative">
                {timeSlots.map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-6 border-b border-gray-200" style={{ height: "80px" }}>
                    <div className="p-4 bg-gray-50 border-r border-gray-200 flex items-start">
                      <span className="text-sm text-gray-600">{time}</span>
                    </div>

                    {days.map((_, dayIndex) => (
                      <div key={dayIndex} className="border-l border-gray-200 relative">
                        {schedule
                          .filter((item) => item.day === dayIndex && item.startTime === timeIndex)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className={`absolute inset-1 ${item.color} text-white rounded-lg p-2 overflow-hidden`}
                              style={{ height: `${item.duration * 80 - 8}px` }}
                            >
                              <p className="text-sm">{item.code}</p>
                              <p className="text-xs opacity-90">{item.course}</p>
                              <p className="text-xs opacity-75 mt-1">{item.room}</p>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {uniqueCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600">
              No enrolled courses found.
            </div>
          ) : (
            uniqueCourses.map((item) => (
              <div key={item.code} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <div>
                  <p className="text-sm text-gray-900">{item.code}</p>
                  <p className="text-xs text-gray-500">{item.course}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}