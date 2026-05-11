import { Navigate, createBrowserRouter } from "react-router-dom";

import { ControlEventsRegistryPage } from "../pages/control-events-registry/ControlEventsRegistryPage";
import { CryptoToolsRegistryPage } from "../pages/crypto-tools-registry/CryptoToolsRegistryPage";
import { DataCentersRegistryPage } from "../pages/data-centers-registry/DataCentersRegistryPage";
import { EmployeesRegistryPage } from "../pages/employees-registry/EmployeesRegistryPage";
import { IspdnCardPage } from "../pages/ispdn-card/IspdnCardPage";
import { IspdnCreatePage } from "../pages/ispdn-card/IspdnCreatePage";
import { IspdnCryptographyPage } from "../pages/ispdn-card/IspdnCryptographyPage";
import { IspdnDataCentersPage } from "../pages/ispdn-card/IspdnDataCentersPage";
import { IspdnDocumentsPage } from "../pages/ispdn-card/IspdnDocumentsPage";
import { IspdnProcessingPage } from "../pages/ispdn-card/IspdnProcessingPage";
import { IspdnSecurityLevelPage } from "../pages/ispdn-card/IspdnSecurityLevelPage";
import { IspdnSecurityMeasuresPage } from "../pages/ispdn-card/IspdnSecurityMeasuresPage";
import { IspdnTasksPage } from "../pages/ispdn-card/IspdnTasksPage";
import { IspdnThreatModelPage } from "../pages/ispdn-card/IspdnThreatModelPage";
import { IspdnArchivePage } from "../pages/ispdn-registry/IspdnArchivePage";
import { IspdnRegistryPage } from "../pages/ispdn-registry/IspdnRegistryPage";
import { OrganizationCardPage } from "../pages/organization-card/OrganizationCardPage";
import { ProcessingProcessesRegistryPage } from "../pages/processing-processes-registry/ProcessingProcessesRegistryPage";
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
        path: "ispdns/archive",
        element: <IspdnArchivePage />,
      },
      {
        path: "ispdns/new",
        element: <IspdnCreatePage />,
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
        path: "ispdns/:ispdnId/tasks",
        element: <IspdnTasksPage />,
      },
      {
        path: "ispdns/:ispdnId/documents",
        element: <IspdnDocumentsPage />,
      },
      {
        path: "ispdns/:ispdnId/data-centers",
        element: <IspdnDataCentersPage />,
      },
      {
        path: "ispdns/:ispdnId/cryptography",
        element: <IspdnCryptographyPage />,
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
        path: "processing-processes",
        element: <ProcessingProcessesRegistryPage />,
      },
      {
        path: "control-events",
        element: <ControlEventsRegistryPage />,
      },
      {
        path: "data-centers",
        element: <DataCentersRegistryPage />,
      },
      {
        path: "cryptography",
        element: <CryptoToolsRegistryPage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
    ],
  },
]);
