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

export function MySchedule() {
  const schedule: ScheduleItem[] = [
    { day: 0, startTime: 1, duration: 2, course: "Data Structures", code: "CS 201", room: "Room 301", color: "bg-blue-500" },
    { day: 2, startTime: 1, duration: 2, course: "Data Structures", code: "CS 201", room: "Room 301", color: "bg-blue-500" },
    { day: 1, startTime: 3, duration: 1, course: "Database Systems", code: "CS 301", room: "Lab 105", color: "bg-purple-500" },
    { day: 3, startTime: 3, duration: 1, course: "Database Systems", code: "CS 301", room: "Lab 105", color: "bg-purple-500" },
    { day: 0, startTime: 5, duration: 2, course: "Linear Algebra", code: "MATH 301", room: "Room 202", color: "bg-green-500" },
    { day: 4, startTime: 2, duration: 1, course: "English Comp", code: "ENG 102", room: "Room 401", color: "bg-orange-500" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">Spring 2026 Weekly Timetable</p>
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
                          .filter(item => item.day === dayIndex && item.startTime === timeIndex)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className={`absolute inset-1 ${item.color} text-white rounded-lg p-2 overflow-hidden`}
                              style={{
                                height: `${item.duration * 80 - 8}px`,
                              }}
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
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <div>
              <p className="text-sm text-gray-900">CS 201</p>
              <p className="text-xs text-gray-500">Data Structures</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <div>
              <p className="text-sm text-gray-900">CS 301</p>
              <p className="text-xs text-gray-500">Database Systems</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <div>
              <p className="text-sm text-gray-900">MATH 301</p>
              <p className="text-xs text-gray-500">Linear Algebra</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <div>
              <p className="text-sm text-gray-900">ENG 102</p>
              <p className="text-xs text-gray-500">English Composition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
