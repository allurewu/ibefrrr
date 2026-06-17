import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle,
  Clock, 
  Map, 
  Save, 
  ChevronRight, 
  ListOrdered,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { ValueAveragePlan, AppSettings, InvestmentRecord, StockQuote } from "../types";
import { formatCurrency, getElapsedMonths, getTargetValueForMonth, generatePlanMonths } from "../utils";

interface PlanProps {
  plan: ValueAveragePlan | null;
  settings: AppSettings;
  records: InvestmentRecord[];
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
  onSavePlan: (plan: ValueAveragePlan) => Promise<any>;
  onRefreshQuotes?: () => void;
  loadingQuotes?: boolean;
}

export default function Plan({
  plan,
  settings,
  records,
  quotes,
  onSavePlan,
  onRefreshQuotes,
  loadingQuotes = false,
}: PlanProps) {
  // Helper to get actual current month’s first day in YYYY-MM-DD format
  const getDefaultStartDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  };

  const getDefaultEndDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear() + 30;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  };

  // Plan setup hook form state
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [initialCapital, setInitialCapital] = useState("500");
  const [monthlyGrowth, setMonthlyGrowth] = useState("500");

  // Show status triggers
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [showEntireMonths, setShowEntireMonths] = useState(false);

  // Sync state if plan already exists
  useEffect(() => {
    if (plan) {
      setStartDate(plan.startDate);
      setEndDate(plan.endDate);
      setInitialCapital(plan.initialCapital.toString());
      setMonthlyGrowth(plan.monthlyGrowth.toString());
    }
  }, [plan]);

  // Calculations
  const qqqRecords = records.filter(r => r.symbol === "QQQM");
  const vooRecords = records.filter(r => r.symbol === "VOO");

  const qqqShares = qqqRecords.reduce((sum, r) => sum + r.shares, 0);
  const vooShares = vooRecords.reduce((sum, r) => sum + r.shares, 0);

  const qqqCost = qqqRecords.reduce((sum, r) => sum + r.amount, 0);
  const vooCost = vooRecords.reduce((sum, r) => sum + r.amount, 0);
  const qqqAvgCost = qqqShares > 0 ? qqqCost / qqqShares : 0;
  const vooAvgCost = vooShares > 0 ? vooCost / vooShares : 0;

  const qqqPrice = quotes.QQQM?.price ?? qqqAvgCost ?? 0;
  const vooPrice = quotes.VOO?.price ?? vooAvgCost ?? 0;

  const currentPortfolioValue = (qqqShares * qqqPrice) + (vooShares * vooPrice);

  // Handle Plan submission
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessText("");
    setErrorText("");

    const initial = parseFloat(initialCapital);
    const growth = parseFloat(monthlyGrowth);

    if (isNaN(initial) || initial <= 0) {
      setErrorText("初始本金必须是大于 0 的数值");
      return;
    }
    if (isNaN(growth) || growth <= 0) {
      setErrorText("月目标增长金额必须是大于 0 的数值");
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      setErrorText("结束日期必须大于起始日期");
      return;
    }

    const payload: ValueAveragePlan = {
      startDate,
      endDate,
      initialCapital: initial,
      monthlyGrowth: growth,
    };

    try {
      await onSavePlan(payload);
      setSuccessText("VA计划大纲已确认并保存成功！系统已重构对应的月份序列和目标价值。");
    } catch (err: any) {
      setErrorText("保存VA规则发生错误: " + err.message);
    }
  };

  // Generate sequence months
  const monthsArray = plan
    ? generatePlanMonths(plan.startDate, plan.endDate, plan.initialCapital, plan.monthlyGrowth)
    : [];

  const currentMonthIdx = plan ? getElapsedMonths(plan.startDate) : 1;
  const currentMonthTargetValue = plan 
    ? getTargetValueForMonth(currentMonthIdx, plan.initialCapital, plan.monthlyGrowth)
    : 0;

  const currentMonthGap = currentMonthTargetValue - currentPortfolioValue;
  const currentMonthSuggest = currentMonthGap > 0 ? currentMonthGap : 0;

  // Split建议
  const qqqSuggest = currentMonthSuggest * (settings.qqqmRatio / 100);
  const vooSuggest = currentMonthSuggest * (settings.vooRatio / 100);

  // Paginate months array or slice to save CPU
  const itemsBeforeActive = 2;
  const itemsAfterActive = 3;
  const activeIdxOffset = monthsArray.findIndex(m => m.index === currentMonthIdx);

  const slicedMonths = showEntireMonths 
    ? monthsArray 
    : (activeIdxOffset !== -1 
        ? monthsArray.slice(
            Math.max(0, activeIdxOffset - itemsBeforeActive),
            Math.min(monthsArray.length, activeIdxOffset + 1 + itemsAfterActive)
          )
        : monthsArray.slice(0, 5)
      );

  return (
    <div className="space-y-5 pb-24">
      {/* Unified Screen Title Accent */}
      <div className="space-y-1 mb-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">价值计划</h1>
        <p className="text-[11px] text-slate-400 font-medium leading-normal">
          让您的资产总额每月按固定金额平稳增长
        </p>
      </div>

      {/* 3.1 计划配置 Form */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4.5 space-y-4">
        <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-200/50 pb-2.5 uppercase tracking-wide">
          <Map className="w-4 h-4 text-blue-600" />
          <span>VA规则配置</span>
        </h2>

        {successText && (
          <div className="p-3 bg-brand-green/5 border border-brand-green/20 text-brand-green text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-brand-green" />
            <span>{successText}</span>
          </div>
        )}

        {errorText && (
          <div className="p-3 bg-brand-red/5 border border-brand-red/20 text-brand-red text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-brand-red" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmitPlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                起始月份
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                截止月份
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Initial Capital */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                第1个月初始目标市值
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="例如: 500"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>

            {/* Monthly target growth */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                后续月目标递增额
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="例如: 500"
                value={monthlyGrowth}
                onChange={(e) => setMonthlyGrowth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            id="confirm_save_plan_btn"
            className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            更新或确认 VA 规则计划书
          </button>
        </form>
      </div>

      {/* 3.2 当前定投执行状态高亮 Card */}
      {plan && (
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-1">当前月份执行状态</h2>
          
          <div className="bg-gradient-to-r from-blue-50/60 to-slate-100/60 border border-blue-100 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center bg-[#F3F3F3] p-2.5 rounded-xl border border-[#FFFFFF]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-xs font-bold text-blue-800">当前活跃：计划第 {currentMonthIdx} 个月</span>
              </div>
              <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                当前定投月
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div className="bg-[#F3F3F3] p-3 rounded-xl border border-[#FFFFFF]">
                <span className="text-[10px] text-slate-400 block font-bold">本月拟定目标总市值</span>
                <span className="text-base font-bold font-mono text-slate-800 block mt-1">{formatCurrency(currentMonthTargetValue)}</span>
              </div>
              <div className="bg-[#F3F3F3] p-3 rounded-xl border border-[#FFFFFF]">
                <span className="text-[10px] text-slate-400 block font-bold">目前持仓组合公允价值</span>
                <span className="text-base font-bold font-mono text-slate-800 block mt-1">{formatCurrency(currentPortfolioValue)}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F3F3F3] rounded-xl border border-[#FFFFFF] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-bold">本期拟定加投总额:</span>
                {currentMonthSuggest > 0 ? (
                  <span className="font-mono text-brand-yellow font-extrabold text-sm bg-brand-yellow/5 border border-brand-yellow/20 px-2.5 py-0.5 rounded-lg animate-pulse">
                    {formatCurrency(currentMonthSuggest)}
                  </span>
                ) : (
                  <span className="text-brand-green font-extrabold bg-brand-green/5 px-2 py-0.5 rounded border border-brand-green/20">
                    本期无需投入 (行情表现优异!)
                  </span>
                )}
              </div>

              {currentMonthSuggest > 0 && (
                <div className="space-y-2 pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 flex justify-between items-center font-bold">
                    <span>各标的拟平衡分配额:</span>
                    <span>QQQM {settings.qqqmRatio}% | VOO {settings.vooRatio}%</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={onRefreshQuotes}
                      disabled={loadingQuotes}
                      title="点击调用 Edge Function 刷新行情"
                      className="bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-100 text-left transition active:scale-95 cursor-pointer disabled:opacity-60 flex flex-col justify-between w-full"
                    >
                      <span className="text-slate-400 text-[10px] block font-bold mb-0.5 w-full flex items-center justify-between">
                        QQQM 拟购
                        <RefreshCw className={`w-2.5 h-2.5 text-[#6366F1] shrink-0 ml-1 ${loadingQuotes ? 'animate-spin' : ''}`} />
                      </span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(qqqSuggest)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRefreshQuotes}
                      disabled={loadingQuotes}
                      title="点击调用 Edge Function 刷新行情"
                      className="bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-100 text-left transition active:scale-95 cursor-pointer disabled:opacity-60 flex flex-col justify-between w-full"
                    >
                      <span className="text-slate-400 text-[10px] block font-bold mb-0.5 w-full flex items-center justify-between">
                        VOO 拟购
                        <RefreshCw className={`w-2.5 h-2.5 text-[#0EA5E9] shrink-0 ml-1 ${loadingQuotes ? 'animate-spin' : ''}`} />
                      </span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(vooSuggest)}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sliced sequence Month list */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-blue-600" />
                长期里程碑序列
              </span>
              <button
                onClick={() => setShowEntireMonths(!showEntireMonths)}
                className="text-[10px] text-blue-600 font-bold uppercase hover:underline cursor-pointer"
              >
                {showEntireMonths ? "精简显示" : "显示完整 360 月大表"}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {slicedMonths.map((m) => {
                const isActive = m.index === currentMonthIdx;
                return (
                  <div 
                    key={m.index}
                    className={`p-3 rounded-xl border flex justify-between items-center transition ${
                      isActive 
                        ? "bg-blue-50/50 border-blue-300" 
                        : "bg-slate-50/30 border-slate-200/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center font-mono border ${
                        isActive 
                          ? "bg-blue-600 text-white border-blue-750" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        M{m.index}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 font-mono">{m.dateLabel}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isActive ? "✨ 正在执行的活动定投月" : `月定投里程碑`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">目标市值 milestone</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{formatCurrency(m.targetValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!showEntireMonths && monthsArray.length > slicedMonths.length && (
              <p className="text-[10px] text-slate-400 text-center font-medium mt-1">
                已自动隐藏其余非核心月份。开启大表可查阅完整的财富递增模拟曲线。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
