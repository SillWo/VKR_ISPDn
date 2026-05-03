import { Navigate, createBrowserRouter } from "react-router-dom";

import { EmployeesRegistryPage } from "../pages/employees-registry/EmployeesRegistryPage";
import { IspdnCardPage } from "../pages/ispdn-card/IspdnCardPage";
import { IspdnProcessingPage } from "../pages/ispdn-card/IspdnProcessingPage";
import { IspdnSecurityLevelPage } from "../pages/ispdn-card/IspdnSecurityLevelPage";
import { IspdnSecurityMeasuresPage } from "../pages/ispdn-card/IspdnSecurityMeasuresPage";
import { IspdnThreatModelPage } from "../pages/ispdn-card/IspdnThreatModelPage";
import { IspdnRegistryPage } from "../pages/ispdn-registry/IspdnRegistryPage";
import { OrganizationCardPage } from "../pages/organization-card/OrganizationCardPage";
import { ProcessingPurposesRegistryPage } from "../pages/processing-purposes-registry/ProcessingPurposesRegistryPage";
import { TasksPage } from "../pages/tasks/TasksPage";
import { AppLayout } from "../widgets/layout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/ispdns" replace />,
      },
      {
        path: "ispdns",
        element: <IspdnRegistryPage />,
      },
      {
        path: "ispdns/:ispdnId",
        element: <IspdnCardPage />,
      },
      {
        path: "ispdns/:ispdnId/processing",
        element: <IspdnProcessingPage />,
      },
      {
        path: "ispdns/:ispdnId/security-level",
        element: <IspdnSecurityLevelPage />,
      },
      {
        path: "ispdns/:ispdnId/security-measures",
        element: <IspdnSecurityMeasuresPage />,
      },
      {
        path: "ispdns/:ispdnId/threat-model",
        element: <IspdnThreatModelPage />,
      },
      {
        path: "organization",
        element: <OrganizationCardPage />,
      },
      {
        path: "employees",
        element: <EmployeesRegistryPage />,
      },
      {
        path: "processing-purposes",
        element: <ProcessingPurposesRegistryPage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
    ],
  },
]);
