import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole, AssignmentStatus, MembershipStatus } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { TasksManagerClient } from "./TasksManagerClient";
import { Layers, CheckCircle2, Clock, AlertTriangle, Users } from "lucide-react";

export default async function TasksManagerPage() {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const isCompanyAdmin = context.membership!.role === CompanyRole.COMPANY_ADMIN;
  const callerMembershipId = context.membership!.id;

  const now = new Date();

  // Metrics and data queries
  const [tasks, departments, batches, employees, overdueCount, pendingReviewCount, completedCount] =
    await Promise.all([
      db.task.findMany({
        where: { companyId },
        include: {
          creator: {
            include: { user: true },
          },
          _count: {
            select: { assignments: true },
          },
          assignments: {
            include: {
              employeeMembership: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.department.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
      }),
      db.trainingBatch.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
      }),
      db.companyMembership.findMany({
        where: {
          companyId,
          status: MembershipStatus.ACTIVE,
          ...(isCompanyAdmin ? {} : { employeeProfile: { managerMembershipId: callerMembershipId } }),
        },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.taskAssignment.count({
        where: {
          task: { companyId, isArchived: false },
          status: { not: AssignmentStatus.COMPLETED },
          dueDate: { lt: now },
        },
      }),
      db.taskAssignment.count({
        where: {
          task: { companyId, isArchived: false },
          status: { in: [AssignmentStatus.SUBMITTED, AssignmentStatus.UNDER_REVIEW] },
        },
      }),
      db.taskAssignment.count({
        where: {
          task: { companyId },
          status: AssignmentStatus.COMPLETED,
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Task & Training Activity Engine
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Design, assign, duplicate, and supervise tasks, compliance modules, and historical certifications for {context.company!.name}.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Total Tasks</span>
              <Layers className="w-4 h-4 text-editorial-800" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {tasks.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active curricula & daily tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {pendingReviewCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Submissions awaiting sign-off</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Overdue Work</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700">
              {overdueCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Past deadline & incomplete</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {completedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Approved & certified</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Client Hub */}
      <TasksManagerClient
        initialTasks={tasks as any}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        employees={employees.map((e) => ({
          id: e.id,
          name: [e.user.firstName, e.user.lastName].filter(Boolean).join(" ") || e.user.email,
          email: e.user.email,
        }))}
      />
    </div>
  );
}
