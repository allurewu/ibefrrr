import React, { useState, useRef } from "react";
import { 
  Sliders, 
  Database, 
  Download, 
  Upload, 
  Check, 
  Info, 
  RefreshCw,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  Award
} from "lucide-react";
import { AppSettings, InvestmentRecord, ValueAveragePlan } from "../types";

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<any>;
  onExportData: () => void;
  onImportData: (jsonData: string) => Promise<boolean>;
  onResetDatabase: () => Promise<void>;
}

export default function Settings({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetDatabase,
}: SettingsProps) {
  // Ratio inputs
  const [qqqmRatio, setQqqmRatio] = useState<number>(settings.qqqmRatio);
  const [vooRatio, setVooRatio] = useState<number>(settings.vooRatio);
  const [provider, setProvider] = useState<string>(settings.provider);

  // Status triggers
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle QQQM ratio slider changes (auto-balance VOO to ensure sum is exactly 100)
  const handleQqqmChange = (val: number) => {
    setQqqmRatio(val);
    setVooRatio(100 - val);
  };

  // Handle VOO ratio slider changes
  const handleVooChange = (val: number) => {
    setVooRatio(val);
    setQqqmRatio(100 - val);
  };

  const handleSaveRatios = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessText("");
    setErrorText("");

    if (qqqmRatio + vooRatio !== 100) {
      setErrorText("定投占比两者之和必须为 100%");
      return;
    }

    try {
      await onSaveSettings({
        qqqmRatio,
        vooRatio,
        provider,
      });
      setSuccessText("配置修改成功！今后的定投建议拆分将自动按此比例核算。");
    } catch (err: any) {
      setErrorText("保存配置出错: " + err.message);
    }
  };


  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const success = await onImportData(content);
        if (success) {
          setSuccessText("数据包导入并重载成功！全部 VA 计划、配置和历史账目已完全恢复。");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setErrorText("导入文件失败，不符合 VA Invest 备份模型");
        }
      } catch (err: any) {
        setErrorText("解析备份包失败: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleClearDatabase = async () => {
    if (confirm("⚠️ 警告：这将永久删除此系统的所有买入记录和 VA 计划！！！此操作不可逆！是否继续？")) {
      await onResetDatabase();
      setSuccessText("系统本地数据库已全部恢复出厂初始状态。");
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Unified Screen Title Accent */}
      <div className="space-y-1 mb-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">系统设置</h1>
        <p className="text-[11px] text-slate-400 font-medium leading-normal">
          配置目标定投划分比例，备份与重置记账数据包
        </p>
      </div>

      {successText && (
        <div className="p-3 bg-brand-green/5 border border-brand-green/20 text-brand-green text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-brand-green" />
          <span>{successText}</span>
        </div>
      )}

      {errorText && (
        <div className="p-3 bg-brand-red/5 border border-brand-red/20 text-brand-red text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-brand-red" />
          <span>{errorText}</span>
        </div>
      )}

      {/* 5.1 ETF配置 Allocation Ratio slider */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4.5 mb-4 space-y-4">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/50 pb-2.5">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>定投资产配置占比</span>
        </h2>

        <form onSubmit={handleSaveRatios} className="space-y-4">
          {/* Proportional Display Bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
              当前配比视觉预览
            </label>
            <div className="h-6 w-full rounded-xl overflow-hidden flex border border-[#FFFFFF] shadow-inner bg-slate-200">
              <div 
                style={{ width: `${qqqmRatio}%` }} 
                className="bg-blue-600 text-[10px] text-white font-extrabold flex items-center justify-center transition-all duration-300 ease-out"
              >
                {qqqmRatio > 15 ? `QQQM ${qqqmRatio}%` : `${qqqmRatio}%`}
              </div>
              <div 
                style={{ width: `${vooRatio}%` }} 
                className="bg-sky-500 text-[10px] text-white font-extrabold flex items-center justify-center transition-all duration-300 ease-out border-l border-[#FFFFFF]/10"
              >
                {vooRatio > 15 ? `VOO ${vooRatio}%` : `${vooRatio}%`}
              </div>
            </div>
          </div>

          {/* Unified Controller Slider */}
          <div className="space-y-2 bg-white/70 rounded-xl p-3 border border-[#FFFFFF] shadow-sm">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              <span>← 调整增加 QQQM (科技)</span>
              <span>调整增加 VOO (标普) →</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={qqqmRatio}
              onChange={(e) => handleQqqmChange(parseInt(e.target.value))}
              className="w-full accent-[#194D43] bg-slate-200/70 h-1.5 rounded-lg cursor-pointer"
            />
            
            <div className="flex justify-between items-center text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
                <span className="text-slate-700">QQQM: <strong className="font-mono text-slate-900">{qqqmRatio}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block"></span>
                <span className="text-slate-700">VOO: <strong className="font-mono text-slate-900">{vooRatio}%</strong></span>
              </div>
            </div>
          </div>

          {/* Style Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
              一键预设投资风格
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "进取成长 (7:3)", qqqm: 70, desc: "科技主导" },
                { label: "均衡配比 (5:5)", qqqm: 50, desc: "两强并重" },
                { label: "平稳核心 (3:7)", qqqm: 30, desc: "标普主导" }
              ].map((preset) => {
                const isActive = qqqmRatio === preset.qqqm;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQqqmChange(preset.qqqm)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#194D43] border-[#194D43] text-white shadow-sm"
                        : "bg-white/60 border-slate-200/80 hover:border-blue-300 text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold leading-normal">{preset.label}</span>
                    <span className={`text-[8px] font-medium leading-none mt-1 ${isActive ? "text-blue-100/80" : "text-slate-400"}`}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            id="save_settings_btn"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            保存配置占比
          </button>
        </form>
      </div>

      {/* 5.3 数据管理 Backup / Import Export */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4.5 mt-0 mr-0 mb-0 ml-0 space-y-4">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/50 pb-2.5">
          <Database className="w-4 h-4 text-[#194D43]" />
          <span>账包导入导出与安全</span>
        </h2>



        <div className="grid grid-cols-3 gap-2 pt-0">
          {/* Export button */}
          <button
            onClick={onExportData}
            id="export_json_btn"
            className="py-2.5 bg-slate-50 border border-slate-200 hover:border-blue-500/30 text-slate-600 hover:text-blue-600 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            备份数据
          </button>

          {/* Import file and button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={triggerImport}
            id="import_json_btn"
            className="py-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-500/30 text-slate-600 hover:text-indigo-600 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#194D43]" />
            恢复数据
          </button>

          {/* Database drop/factory restore */}
          <button
            onClick={handleClearDatabase}
            id="clear_database_btn"
            className="py-2.5 bg-brand-red/5 hover:bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl transition text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-brand-red" />
            出厂归零
          </button>
        </div>
      </div>
    </div>
  );
}
