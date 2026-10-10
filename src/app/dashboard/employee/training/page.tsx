import { requireActiveCompanyContext } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GraduationCap, Clock, Award } from "lucide-react";

export default async function EmployeeTrainingPage() {
  await requireActiveCompanyContext();

  const courses = [
    {
      id: "1",
      title: "Corporate Governance & Compliance Foundations",
      duration: "45 mins",
      modules: 4,
      status: "In Progress",
      progress: 60,
    },
    {
      id: "2",
      title: "Enterprise Cybersecurity & Zero Trust Protocols",
      duration: "30 mins",
      modules: 3,
      status: "Not Started",
      progress: 0,
    },
    {
      id: "3",
      title: "Team Collaboration & Productivity Stack",
      duration: "60 mins",
      modules: 5,
      status: "Not Started",
      progress: 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Training Modules & Certifications
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Complete your required learning track and earn internal verification badges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={course.status === "In Progress" ? "coral" : "neutral"}>
                  {course.status}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-brand-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {course.duration}
                </span>
              </div>
              <CardTitle className="text-base">{course.title}</CardTitle>
              <CardDescription>{course.modules} learning lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-brand-muted">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-canvas-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-editorial-800 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
