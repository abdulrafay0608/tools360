// components/icons/ToolIcon.js
import React from "react";
import {
  FaTools,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaLock,
  FaLockOpen,
  FaImage,
  FaSignature,
  FaCrop,
  FaCode,
  FaArchive,
  FaWrench,
  FaCamera,
  FaSearch,
  FaExchangeAlt,
  FaEyeSlash,
  FaCalculator,
  FaChartLine,
  FaClock,
  FaKeyboard,
  FaList,
  FaClipboard,
  FaCalendarAlt,
  FaNetworkWired,
  FaPalette,
  FaUserTie,
  FaGraduationCap,
} from "react-icons/fa";

const ToolIcon = ({ icon, className }) => {
  const iconMap = {
    merge: <FaTools className={className} />,
    split: <FaFilePdf className={className} />,
    compress: <FaFilePdf className={className} />,
    word: <FaFileWord className={className} />,
    excel: <FaFileExcel className={className} />,
    ppt: <FaFilePowerpoint className={className} />,
    lock: <FaLock className={className} />,
    unlock: <FaLockOpen className={className} />,
    image: <FaImage className={className} />,
    signature: <FaSignature className={className} />,
    crop: <FaCrop className={className} />,
    code: <FaCode className={className} />,
    archive: <FaArchive className={className} />,
    repair: <FaWrench className={className} />,
    camera: <FaCamera className={className} />,
    ocr: <FaSearch className={className} />,
    compare: <FaExchangeAlt className={className} />,
    redact: <FaEyeSlash className={className} />,
    finance: <FaCalculator className={className} />,
    seo: <FaChartLine className={className} />,
    productivity: <FaClock className={className} />,
    text: <FaKeyboard className={className} />,
    numbers: <FaList className={className} />,
    clipboard: <FaClipboard className={className} />,
    career: <FaUserTie className={className} />,
    network: <FaNetworkWired className={className} />,
    color: <FaPalette className={className} />,
    // Add more mappings as needed
  };

  return iconMap[icon] || <FaTools className={className} />;
};

export default ToolIcon;
