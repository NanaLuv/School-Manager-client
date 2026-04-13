import React, { useState, useEffect } from "react";
import {
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  UserIcon,
  CreditCardIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";

const SchoolSettings = () => {
  const [settings, setSettings] = useState({
    school_name: "",
    school_short_name: "",
    motto: "",
    address: "",
    city: "",
    region: "",
    postal_code: "",
    phone_numbers: [""],
    email: "",
    website: "",
    principal_name: "",
    registration_number: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    account_name: "",
    swift_code: "",
    mobile_money_provider: "",
    mobile_money_number: "",
    currency_symbol: "Ghc",
    receipt_footer: "",
    bill_terms: "",
    late_fee_percentage: 5.0,
    school_logo: null, 
    logo_filename: "", 
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [userId, setUserId] = useState(1); // You should get this from auth
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        "/school-settings"
      );

      let phoneNumbers = response.data.phone_numbers;
      if (typeof phoneNumbers === "string") {
        try {
          phoneNumbers = JSON.parse(phoneNumbers);
        } catch (e) {
          phoneNumbers = [phoneNumbers];
        }
      } else if (!Array.isArray(phoneNumbers)) {
        phoneNumbers = [""];
      }

      setSettings({
        ...response.data,
        phone_numbers: phoneNumbers,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Store both the file AND update settings
    setSettings((prev) => ({
      ...prev,
      school_logo: file,
    }));

    // Also update logo preview state
    setLogoPreview(URL.createObjectURL(file));
  };


  //handle form submit
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);
    setMessage("");

    // Create FormData object
    const formData = new FormData();

    // Add all text fields to FormData
    const fieldsToSend = {
      ...settings,
      phone_numbers: JSON.stringify(
        settings.phone_numbers.filter((num) => num.trim() !== "")
      ),
      updated_by: userId,
      // Convert empty strings to null for optional fields
      swift_code: settings.swift_code || null,
      mobile_money_provider: settings.mobile_money_provider || null,
      mobile_money_number: settings.mobile_money_number || null,
      bill_terms: settings.bill_terms || null,
      school_short_name: settings.school_short_name || null,
      motto: settings.motto || null,
      city: settings.city || null,
      region: settings.region || null,
      postal_code: settings.postal_code || null,
      website: settings.website || null,
      principal_name: settings.principal_name || null,
      registration_number: settings.registration_number || null,
      bank_name: settings.bank_name || null,
      branch_name: settings.branch_name || null,
      account_number: settings.account_number || null,
      account_name: settings.account_name || null,
      receipt_footer: settings.receipt_footer || null,
    };

    // Remove school_logo from fieldsToSend since we handle it separately
    delete fieldsToSend.school_logo;
    delete fieldsToSend.logo_filename;

    // Add all fields to FormData
    Object.keys(fieldsToSend).forEach((key) => {
      if (fieldsToSend[key] !== null && fieldsToSend[key] !== undefined) {
        formData.append(key, fieldsToSend[key]);
      }
    });

    // Add the file if it exists
    if (settings.school_logo && settings.school_logo instanceof File) {
      formData.append("school_logo", settings.school_logo);
    }

    // Send with multipart/form-data headers
    const response = await api.post(
      "/school-settings",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Update local state with response
    if (response.data.logo_filename) {
      setSettings((prev) => ({
        ...prev,
        logo_filename: response.data.logo_filename,
      }));
      setLogoPreview(
        `http://localhost:3001/uploads/school-logo/${response.data.logo_filename}`
      );
    }

    setMessage("Settings saved successfully!");
    setTimeout(() => setMessage(""), 3000);
  } catch (error) {
    console.error("Error saving settings:", error);
    setMessage(
      "Error saving settings: " + (error.response?.data?.error || error.message)
    );
  } finally {
    setSaving(false);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...settings.phone_numbers];
    newPhones[index] = value;

    // Add new empty field if last one is filled
    if (index === newPhones.length - 1 && value.trim() !== "") {
      newPhones.push("");
    }

    setSettings((prev) => ({ ...prev, phone_numbers: newPhones }));
  };

  const removePhone = (index) => {
    if (settings.phone_numbers.length > 1) {
      const newPhones = settings.phone_numbers.filter((_, i) => i !== index);
      setSettings((prev) => ({ ...prev, phone_numbers: newPhones }));
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    setSettings((prev) => ({
      ...prev,
      school_logo: null,
      logo_filename: null,
    }));
  };

  const tabs = [
    { id: "basic", name: "Basic Info", icon: BuildingLibraryIcon },
    { id: "contact", name: "Contact", icon: MapPinIcon },
    { id: "admin", name: "Administration", icon: UserIcon },
    { id: "bank", name: "Bank Details", icon: CreditCardIcon },
    { id: "documents", name: "Documents", icon: DocumentTextIcon },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <Cog6ToothIcon className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              School Settings
            </h1>
            <p className="text-gray-600">
              Configure school information for all documents and reports
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.includes("success")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.includes("success") ? (
              <CheckCircleIcon className="w-5 h-5 inline mr-2" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            )}
            {message}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow border p-6">
          {/* Basic Information */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  School Information
                </h3>
                {/* Logo Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Logo
                  </label>

                  <div className="flex items-start space-x-6">
                    {/* Logo Preview */}
                    {/* <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                          {logoPreview || settings.logo_filename ? (
                            <img
                              src={
                                logoPreview ||
                                `http://localhost:3001/uploads/school-logo/${settings.logo_filename}`
                              }
                              alt="School Logo"
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <BuildingLibraryIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <span className="text-xs text-gray-500">
                                No logo
                              </span>
                            </div>
                          )}
                        </div>

                        {logoPreview || settings.logo_filename ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview("");
                              setSettings((prev) => ({
                                ...prev,
                                logo_filename: null,
                              }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div> */}

                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="School Logo"
                              className="w-full h-full object-contain p-2"
                            />
                          ) : settings.logo_filename ? (
                            <img
                              src={`http://localhost:3001/uploads/school-logo/${settings.logo_filename}`}
                              alt="School Logo"
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = `
              <div class="text-center p-4">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs text-gray-500">Logo not found</span>
              </div>
            `;
                              }}
                            />
                          ) : (
                            <div className="text-center p-4">
                              <BuildingLibraryIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <span className="text-xs text-gray-500">
                                No logo
                              </span>
                            </div>
                          )}
                        </div>

                        {(logoPreview || settings.logo_filename) && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Remove logo"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload New Logo
                        </label>
                        <div className="flex items-center">
                          <input
                            type="file"
                            id="school_logo"
                            name="school_logo"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="school_logo"
                            className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Choose File
                          </label>
                          <span className="ml-3 text-sm text-gray-500">
                            {settings.school_logo?.name || "No file chosen"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• Recommended: 300x300 pixels, square format</p>
                        <p>• Max file size: 5MB</p>
                        <p>• Formats: JPG, PNG, GIF, WebP</p>
                        <p>• Logo will appear on all documents and receipts</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      name="school_name"
                      value={settings.school_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Name
                    </label>
                    <input
                      type="text"
                      name="school_short_name"
                      value={settings.school_short_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="e.g., SMA"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Motto
                    </label>
                    <input
                      type="text"
                      name="motto"
                      value={settings.motto}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="e.g., Excellence in Education"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Currency Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency Symbol *
                    </label>
                    <input
                      type="text"
                      name="currency_symbol"
                      value={settings.currency_symbol}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="Ghc"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Fee Percentage
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="late_fee_percentage"
                        value={settings.late_fee_percentage}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full border p-2 rounded"
                      />
                      <span className="ml-2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={settings.address}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={settings.city}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region/State
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={settings.region}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={settings.postal_code}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="email"
                        name="email"
                        value={settings.email}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <div className="flex items-center">
                      <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="url"
                        name="website"
                        value={settings.website}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded"
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Phone Numbers
                  </label>
                  {settings.phone_numbers.map((phone, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          handlePhoneChange(index, e.target.value)
                        }
                        className="flex-1 border p-2 rounded"
                        placeholder="(233) XXX-XXXX"
                      />
                      {settings.phone_numbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Administration */}
          {activeTab === "admin" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Administration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Principal/Head Teacher
                    </label>
                    <input
                      type="text"
                      name="principal_name"
                      value={settings.principal_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={settings.registration_number}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="e.g., GES/REG/XXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {activeTab === "bank" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={settings.bank_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="e.g., GCB Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="branch_name"
                      value={settings.branch_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      value={settings.account_number}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="account_name"
                      value={settings.account_name}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Swift Code
                    </label>
                    <input
                      type="text"
                      name="swift_code"
                      value={settings.swift_code}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div> */}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Mobile Money
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      name="mobile_money_provider"
                      value={settings.mobile_money_provider}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    >
                      <option value="">Select Provider</option>
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Vodafone">Vodafone Cash</option>
                      <option value="AirtelTigo">AirtelTigo Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Money Number
                    </label>
                    <input
                      type="text"
                      name="mobile_money_number"
                      value={settings.mobile_money_number}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Settings */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Document Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receipt Footer Text
                    </label>
                    <textarea
                      name="receipt_footer"
                      value={settings.receipt_footer}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      rows="3"
                      placeholder="Thank you for your payment!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill Terms & Conditions
                    </label>
                    <textarea
                      name="bill_terms"
                      value={settings.bill_terms}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      rows="5"
                      placeholder="All payments should be made by the due date to avoid penalties. Late payments attract a 5% charge..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preview Section */}
      <div className="mt-8 bg-gray-50 rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-white p-6 rounded border">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">{settings.school_name}</h2>
            <p className="text-gray-600">{settings.motto}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <p className="text-gray-600">{settings.address}</p>
              {settings.city && (
                <p className="text-gray-600">
                  {settings.city}, {settings.region}
                </p>
              )}
              {settings.phone_numbers[0] && (
                <p className="text-gray-600">
                  Phone: {settings.phone_numbers[0]}
                </p>
              )}
              {settings.email && (
                <p className="text-gray-600">Email: {settings.email}</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Bank Details</h4>
              {settings.bank_name && (
                <>
                  <p className="text-gray-600">{settings.bank_name}</p>
                  <p className="text-gray-600">
                    A/C Name: {settings.account_name}
                  </p>
                  <p className="text-gray-600">
                    A/C No: {settings.account_number}
                  </p>
                  {settings.branch_name && (
                    <p className="text-gray-600">
                      Branch: {settings.branch_name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;
