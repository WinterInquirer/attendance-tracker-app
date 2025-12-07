import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSunday } from "date-fns";
import { Check, X, ChevronLeft, ChevronRight, Calendar, TrendingUp, Plus, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
}

interface SubjectData {
  name: string;
  attendance: AttendanceRecord[];
}

const Index = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("subjectAttendance");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSubjects(parsed);
      if (parsed.length > 0) {
        setSelectedSubject(parsed[0].name);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("subjectAttendance", JSON.stringify(subjects));
  }, [subjects]);

  const currentSubject = subjects.find((s) => s.name === selectedSubject);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  const addSubject = () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      toast.error("Please enter a subject name");
      return;
    }
    if (subjects.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }
    const newSubject: SubjectData = { name: trimmedName, attendance: [] };
    setSubjects([...subjects, newSubject]);
    setSelectedSubject(trimmedName);
    setNewSubjectName("");
    setShowAddSubject(false);
    toast.success(`Added ${trimmedName}`);
  };

  const deleteSubject = (name: string) => {
    setSubjects(subjects.filter((s) => s.name !== name));
    if (selectedSubject === name) {
      const remaining = subjects.filter((s) => s.name !== name);
      setSelectedSubject(remaining.length > 0 ? remaining[0].name : null);
    }
    toast.success(`Deleted ${name}`);
  };

  const markAttendance = (date: Date, status: "present" | "absent") => {
    if (!selectedSubject) return;
    const dateStr = format(date, "yyyy-MM-dd");

    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.name !== selectedSubject) return subject;
        const existing = subject.attendance.find((r) => r.date === dateStr);
        let newAttendance: AttendanceRecord[];

        if (existing) {
          if (existing.status === status) {
            newAttendance = subject.attendance.filter((r) => r.date !== dateStr);
          } else {
            newAttendance = subject.attendance.map((r) =>
              r.date === dateStr ? { ...r, status } : r
            );
          }
        } else {
          newAttendance = [...subject.attendance, { date: dateStr, status }];
        }
        return { ...subject, attendance: newAttendance };
      })
    );
  };

  const getStatus = (date: Date) => {
    if (!currentSubject) return undefined;
    const dateStr = format(date, "yyyy-MM-dd");
    return currentSubject.attendance.find((r) => r.date === dateStr)?.status;
  };

  const getStats = (subject: SubjectData) => {
    const totalPresent = subject.attendance.filter((r) => r.status === "present").length;
    const totalAbsent = subject.attendance.filter((r) => r.status === "absent").length;
    const totalMarked = totalPresent + totalAbsent;
    const percentage = totalMarked > 0 ? ((totalPresent / totalMarked) * 100).toFixed(1) : "0.0";
    return { totalPresent, totalAbsent, percentage };
  };

  const currentStats = currentSubject ? getStats(currentSubject) : { totalPresent: 0, totalAbsent: 0, percentage: "0.0" };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newMonth;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-8">
      <div className="mx-auto max-w-md space-y-4">
        {/* Header */}
        <header className="pt-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Attendance Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track attendance by subject
          </p>
        </header>

        {/* Subject Selector */}
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Subjects
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSubject(!showAddSubject)}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add Subject Form */}
            {showAddSubject && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter subject name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubject()}
                  className="h-9 text-sm"
                  maxLength={30}
                />
                <Button onClick={addSubject} size="sm" className="h-9 px-3">
                  Add
                </Button>
              </div>
            )}

            {/* Subject Chips */}
            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => {
                  const stats = getStats(subject);
                  const isSelected = selectedSubject === subject.name;
                  return (
                    <button
                      key={subject.name}
                      onClick={() => setSelectedSubject(subject.name)}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <span className="max-w-[100px] truncate">{subject.name}</span>
                      <span
                        className={cn(
                          "text-xs font-normal",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground/60"
                        )}
                      >
                        {stats.percentage}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject.name);
                        }}
                        className={cn(
                          "ml-1 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                          isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-foreground/10"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Add your first subject to start tracking
              </p>
            )}
          </CardContent>
        </Card>

        {/* Only show stats and calendar when a subject is selected */}
        {currentSubject && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-none bg-emerald-500/10 shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-emerald-600">{currentStats.totalPresent}</div>
                  <div className="text-xs text-emerald-600/80">Present</div>
                </CardContent>
              </Card>
              <Card className="border-none bg-rose-500/10 shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-rose-600">{currentStats.totalAbsent}</div>
                  <div className="text-xs text-rose-600/80">Absent</div>
                </CardContent>
              </Card>
              <Card className="border-none bg-primary/10 shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-primary">{currentStats.percentage}%</div>
                  <div className="text-xs text-primary/80">Attendance</div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Progress */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {currentSubject.name} Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      Number(currentStats.percentage) >= 75
                        ? "bg-emerald-500"
                        : Number(currentStats.percentage) >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    )}
                    style={{ width: `${currentStats.percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {Number(currentStats.percentage) >= 75
                    ? "Great! You're above the required attendance"
                    : Number(currentStats.percentage) >= 50
                    ? "Warning: Attendance is getting low"
                    : "Alert: Improve your attendance"}
                </p>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("prev")}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("next")}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day Headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="py-1.5 text-center text-xs font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {daysInMonth.map((day) => {
                    const status = getStatus(day);
                    const isSun = isSunday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all",
                          isToday(day) && "ring-2 ring-primary ring-offset-1",
                          isSun && "text-rose-400",
                          status === "present" && "bg-emerald-500 text-white",
                          status === "absent" && "bg-rose-500 text-white",
                          !status && "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <span className="font-medium">{format(day, "d")}</span>

                        <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-background/95 opacity-0 transition-opacity hover:opacity-100 active:opacity-100">
                          <button
                            onClick={() => markAttendance(day, "present")}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                              status === "present"
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markAttendance(day, "absent")}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                              status === "absent"
                                ? "bg-rose-500 text-white"
                                : "bg-rose-100 text-rose-600 hover:bg-rose-200"
                            )}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full ring-2 ring-primary" />
                    <span>Today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Instructions */}
        <Card className="border-none bg-muted/30 shadow-sm">
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-medium">How to use:</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Add subjects using the + button</li>
              <li>• Tap a subject chip to select it</li>
              <li>• Tap any date to mark Present or Absent</li>
              <li>• Each subject tracks attendance separately</li>
              <li>• Your data is saved automatically</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
