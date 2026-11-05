import { useState } from "react";
import QualityActionsDrawer from "../components/QualityActionsDrawer";
import { Row, Col } from "antd";
import { useAuth } from "../../Authentication/context/AuthContext"; // adjust path if your folder depth differs

import GlobalStyles from "../components/GlobalStyles";
import ErrorPopup from "../components/ErrorPopup";
import ActionBar from "../components/ActionBar";
import HeaderSummaryBar from "../components/HeaderSummaryBar";
import { MissingStageBanner, StatusBar } from "../components/StatusBanners";
import StageRail from "../components/StageRail";
import StatsRow from "../components/StatsRow";
import ScanPanel from "../components/ScanPanel";
import RecentScansPanel from "../components/RecentScansPanel";

import usePrinterSelection from "../hooks/usePrinterSelection";
import useProducts from "../hooks/useProducts";
import useProductionForm from "../hooks/useProductionForm";
import useStageFlow from "../hooks/useStageFlow";
import useRecentScans from "../hooks/useRecentScans";
import useScanSubmission from "../hooks/useScanSubmission";
import useKeepWipFocus from "../hooks/useKeepWipFocus";


export default function MIInput() {
  const { user } = useAuth();
  const { products, orders, productsLoading } = useProducts();
  const productionForm = useProductionForm({ user });
  const stageFlowApi = useStageFlow({ productId: productionForm.form.productId, user });
  const recentScansApi = useRecentScans({ user, productId: productionForm.form.productId,  productionOrderId: productionForm.form.productionOrderId, });
  const stageFlow = stageFlowApi.stageFlow;

  const [qualityDrawerOpen, setQualityDrawerOpen] = useState(false);



  const printer = usePrinterSelection({
    productId: productionForm.form.productId,
    stageId: user?.stage?.id,
  });

  const scan = useScanSubmission({
    user,
    form: productionForm.form,
    setForm: productionForm.setForm,
    mode: productionForm.mode,
    stageFlow: stageFlowApi.stageFlow,
    stageFlowRows: stageFlowApi.stageFlowRows,
    assignedStageIndex: stageFlowApi.assignedStageIndex,
    setStageStats: productionForm.setStageStats,
    fetchLatestScans: recentScansApi.fetchLatestScans,
    printSupported: printer.supportsPrint,
    printerName: printer.printerName,
    checkPrinterReady: printer.checkStatus,
  });

  useKeepWipFocus(scan.wipCodeRef);

  const selectedOrder = orders.find((order) =>
      Number(order.production_order_id) ===
      Number(productionForm.form.productionOrderId)
  ) || null;


  const isPackagingStage =
  Number(stageFlow?.is_packaging_stage) === 1 &&
  Number(stageFlow?.packaging_config_id) > 0;


  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        background: "#f4f6f9",
        overflow: "hidden",
      }}
    >
      <GlobalStyles />
      <ErrorPopup popup={scan.errorPopup} />

      <ActionBar
        selected={productionForm.selected}
        selectedOrder={selectedOrder}
        mode={productionForm.mode}
        onNew={productionForm.handleNew}
        onEdit={productionForm.handleEdit}
        onSave={productionForm.handleSave}
        onCancel={productionForm.handleCancel}
        onOpenQualityActions={() => setQualityDrawerOpen(true)}
      />

      <QualityActionsDrawer
        open={qualityDrawerOpen}
        onClose={() => setQualityDrawerOpen(false)}
      />

      <HeaderSummaryBar stationName={user?.stage?.name} selected={productionForm.selected} />

      <MissingStageBanner missingStages={scan.missingStages} onClose={() => scan.setMissingStages([])} />

      <StatusBar status={productionForm.status} errorMessage={scan.errorMessage} successMessage={scan.successMessage} />

      <div style={{ flex: 1, display: "flex", padding: 14, gap: 14, minHeight: 0 }}>
        <StageRail
          stages={stageFlowApi.STAGES}
          stageStatus={scan.stageStatus}
          flashIndices={scan.flashIndices}
          assignedStageIndex={stageFlowApi.assignedStageIndex}
          missingStages={scan.missingStages}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <StatsRow stageStats={productionForm.stageStats} />

          <Row gutter={14} style={{ flex: 1, minHeight: 0 }}>
            <Col span={12} style={{ height: "100%" }}>
              <ScanPanel
                form={productionForm.form}
                isEditable={productionForm.isEditable}
                mode={productionForm.mode}
                products={products}
                orders={orders}
                selectedOrderId={productionForm.form.productionOrderId}
                onSelectOrder={productionForm.handleOrderSelect}
                productsLoading={productsLoading}
                selected={productionForm.selected}
                onSelectProduct={(productId) => productionForm.handleErpSelect(productId, products)}
                onWipCodeChange={productionForm.updateField("wipBarCode")}
                onWipCodeScanned={scan.handleWipCodeScanned}
                wipCodeRef={scan.wipCodeRef}
                stageFlow={stageFlowApi.stageFlow}
                pendingGroupScans={scan.pendingGroupScans}
                savingGroup={scan.savingGroup}
                onSaveGroup={scan.handleSaveGroup}
                groupSize={scan.groupSize}
                onGroupSizeChange={scan.setGroupSize}
                onRemovePendingScan={scan.handleRemovePendingScan}
                pendingPcbQr={scan.pendingPcbQr}
                onCancelCustomerBinding={scan.handleCancelCustomerBinding}
                printSupported={printer.supportsPrint}
                printerName={printer.printerName}
                printers={printer.printers}
                printerQzState={printer.qzState}
                onSelectPrinter={printer.selectPrinter}
                onRefreshPrinters={printer.refreshPrinters}
                printerVerified={printer.verified}
                onVerified={() => printer.setVerified(true)}
                onTestPrint={printer.testPrint}
                onCheckPrinter={printer.checkStatus}

                printStageId={user?.stage?.id}
                isPackagingStage={isPackagingStage}
              />
            
            </Col>

            <Col span={12} style={{ height: "100%" }}>
              <RecentScansPanel
                  recentScans={recentScansApi.recentScans}
                  productId={productionForm.form.productId}
                  stageId={user?.stage?.id}
                  printerName={printer.printerName}
                  onCheckPrinter={printer.checkStatus}
                  isPackagingStage={
                    isPackagingStage || 
                    user?.stage?.name?.trim().toUpperCase() === "PACKAGING"
                  }
                />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}
