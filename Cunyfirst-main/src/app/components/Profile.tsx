import { useState } from "react";
import { useLocation } from "react-router";
import { User, Mail, Phone, MapPin, Building, Calendar, Bell, Lock, Save } from "lucide-react";
import { toast } from "sonner";

export function Profile() {
  const location = useLocation();
  const isStudent = location.pathname.includes("/student");
  const isInstructor = location.pathname.includes("/instructor");
  const isRegistrar = location.pathname.includes("/registrar");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [registrationAlerts, setRegistrationAlerts] = useState(true);

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
  };

  const handleSavePreferences = () => {
    toast.success("Preferences saved successfully!");
  };

  const handleChangePassword = () => {
    toast.success("Password changed successfully!");
  };

  const getProfileData = () => {
    if (isStudent) {
      return {
        name: "Jessica Chen",
        id: "STU2024001",
        email: "jessica.chen@cuny.edu",
        phone: "(212) 555-0123",
        major: "Computer Science",
        year: "Junior",
        gpa: "3.85",
        credits: "76",
        advisor: "Dr. Robert Martinez",
        address: "1234 Broadway Ave, New York, NY 10001",
      };
    } else if (isInstructor) {
      return {
        name: "Dr. Robert Martinez",
        id: "FAC2019042",
        email: "robert.martinez@cuny.edu",
        phone: "(212) 555-0456",
        department: "Computer Science",
        title: "Associate Professor",
        office: "Room 405, Science Building",
        officeHours: "Mon/Wed 2:00-4:00 PM",
      };
    } else {
      return {
        name: "Patricia Williams",
        id: "ADM2015008",
        email: "patricia.williams@cuny.edu",
        phone: "(212) 555-0789",
        department: "Office of the Registrar",
        title: "Senior Registrar",
        office: "Room 101, Administration Building",
      };
    }
  };

  const profileData = getProfileData();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white font-semibold">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h2 className="text-xl text-gray-900 mb-1">{profileData.name}</h2>
                <p className="text-sm text-gray-600">{profileData.id}</p>
                {isStudent && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl text-blue-600">{profileData.gpa}</p>
                        <p className="text-xs text-gray-600">GPA</p>
                      </div>
                      <div>
                        <p className="text-2xl text-blue-600">{profileData.credits}</p>
                        <p className="text-xs text-gray-600">Credits</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Personal Information</h2>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    defaultValue={profileData.name}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    defaultValue={profileData.email}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </div>
                  </label>
                  <input
                    type="tel"
                    defaultValue={profileData.phone}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {isStudent && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4" />
                          Major
                        </div>
                      </label>
                      <input
                        type="text"
                        defaultValue={profileData.major}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" />
                          Academic Year
                        </div>
                      </label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        <option value="freshman">Freshman</option>
                        <option value="sophomore">Sophomore</option>
                        <option value="junior" selected>Junior</option>
                        <option value="senior">Senior</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </div>
                      </label>
                      <input
                        type="text"
                        defaultValue={profileData.address}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}

                {(isInstructor || isRegistrar) && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4" />
                          Department
                        </div>
                      </label>
                      <input
                        type="text"
                        defaultValue={profileData.department}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          Title
                        </div>
                      </label>
                      <input
                        type="text"
                        defaultValue={profileData.title}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          Office Location
                        </div>
                      </label>
                      <input
                        type="text"
                        defaultValue={profileData.office}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Manage how you receive notifications</p>
                </div>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailNotifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive text message alerts</p>
                  </div>
                  <button
                    onClick={() => setSmsNotifications(!smsNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsNotifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        smsNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-900">Registration Alerts</p>
                    <p className="text-sm text-gray-600">Get notified about course openings</p>
                  </div>
                  <button
                    onClick={() => setRegistrationAlerts(!registrationAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      registrationAlerts ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        registrationAlerts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl text-gray-900 flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5" />
                Security Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
