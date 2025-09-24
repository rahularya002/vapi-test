# Excel Format Guide for Auto Caller Agent

## 📋 **Required Excel Format**

The system expects an Excel file (.xlsx, .xls) with the following structure:

### **Required Columns:**
- **Phone Number** (Required) - The candidate's phone number
- **Name** (Optional) - Candidate's full name
- **Email** (Optional) - Email address
- **Position** (Optional) - Job title/position applied for

### **Supported Column Names:**
The system is flexible and accepts various column name formats:

| Data Type | Accepted Column Names |
|-----------|----------------------|
| **Phone** | `phone`, `Phone`, `PHONE`, `phoneNumber`, `PhoneNumber` |
| **Name** | `name`, `Name`, `NAME`, `candidateName`, `CandidateName` |
| **Email** | `email`, `Email`, `EMAIL`, `emailAddress`, `EmailAddress` |
| **Position** | `position`, `Position`, `POSITION`, `jobTitle`, `JobTitle` |

## 📊 **Sample Excel Format**

### **Option 1: Simple Format**
```
| Name          | Phone         | Email                    | Position        |
|---------------|---------------|--------------------------|-----------------|
| John Doe      | +1234567890   | john@example.com         | Software Dev    |
| Jane Smith    | 9876543210    | jane@example.com         | Marketing Mgr   |
| Bob Johnson   | +1-555-123-4567| bob@company.com         | Sales Rep       |
```

### **Option 2: Detailed Format**
```
| CandidateName | PhoneNumber   | EmailAddress             | JobTitle        |
|---------------|---------------|--------------------------|-----------------|
| John Doe      | +1234567890   | john@example.com         | Software Dev    |
| Jane Smith    | 9876543210    | jane@example.com         | Marketing Mgr   |
| Bob Johnson   | +1-555-123-4567| bob@company.com         | Sales Rep       |
```

### **Option 3: Indian Numbers Format**
```
| Name          | Phone         | Email                    | Position        |
|---------------|---------------|--------------------------|-----------------|
| Rajesh Kumar  | 9876543210    | rajesh@example.com       | Software Dev    |
| Priya Sharma  | 9123456789    | priya@example.com        | Marketing Mgr   |
| Amit Patel    | +91-9876543210| amit@company.com         | Sales Rep       |
```

## 🔧 **Data Processing Rules**

### **Phone Number Processing:**
- **Automatic Formatting**: Converts to E.164 format (e.g., `+91XXXXXXXXXX` for India)
- **Country Code Detection**: Automatically adds `+91` for Indian numbers
- **Format Support**: `+1234567890`, `123-456-7890`, `(123) 456-7890`, `9876543210`
- **Validation**: Phone number is required and must be valid
- **Error Handling**: Invalid phone numbers are rejected with clear error messages

### **Name Processing:**
- **Default**: If no name provided, uses "Candidate 1", "Candidate 2", etc.
- **Format**: Converts to string, handles special characters

### **Email Processing:**
- **Optional**: Can be empty
- **Format**: Converts to string, no validation

### **Position Processing:**
- **Optional**: Can be empty
- **Format**: Converts to string

## 📁 **File Requirements**

- **Supported Formats**: `.xlsx`, `.xls`
- **File Size**: No specific limit (handled by server)
- **Sheet Selection**: Uses the first sheet in the workbook
- **Encoding**: UTF-8 (handled automatically)

## ⚠️ **Common Issues & Solutions**

### **Issue 1: "Phone number is required"**
- **Cause**: Row missing phone number
- **Solution**: Ensure every row has a phone number in one of the accepted column names

### **Issue 2: "Failed to process Excel file"**
- **Cause**: Invalid file format or corrupted file
- **Solution**: Save as .xlsx format and try again

### **Issue 3: Empty rows processed**
- **Cause**: Excel has empty rows
- **Solution**: Remove empty rows before uploading

## 🎯 **Best Practices**

1. **Use Consistent Column Names**: Stick to one naming convention
2. **Clean Data**: Remove empty rows and ensure phone numbers are valid
3. **Test with Small Files**: Start with 5-10 candidates to test
4. **Backup Original**: Keep a copy of your original Excel file
5. **Phone Format**: Use consistent phone number format

## 📝 **Sample Excel Template**

Create an Excel file with this exact structure:

```
| Name          | Phone         | Email                    | Position        |
|---------------|---------------|--------------------------|-----------------|
| John Doe      | +1234567890   | john@example.com         | Software Dev    |
| Jane Smith    | 9876543210    | jane@example.com         | Marketing Mgr   |
| Bob Johnson   | +1-555-123-4567| bob@company.com         | Sales Rep       |
| Alice Brown   | 555-987-6543  | alice@example.com        | HR Manager      |
| Charlie Wilson| +1 (555) 456-7890| charlie@company.com   | Data Analyst    |
```

## 🔄 **Data Flow**

1. **Upload**: Excel file uploaded via web interface
2. **Parse**: System reads first sheet and converts to JSON
3. **Validate**: Each row validated for required fields
4. **Clean**: Phone numbers cleaned and formatted
5. **Store**: Data saved to Supabase database
6. **Queue**: Candidates added to call queue with "pending" status

## 📊 **Expected Output**

After successful upload, you'll see:
- **Total Count**: Number of candidates processed
- **Success Message**: Confirmation of upload
- **Call Queue**: Candidates ready for calling
- **Data Storage**: All data saved to Supabase

## 🚀 **Advanced Features**

- **Bulk Upload**: Handle hundreds of candidates at once
- **Data Validation**: Automatic phone number cleaning
- **Error Reporting**: Clear error messages for invalid data
- **Flexible Format**: Multiple column name variations supported
- **Real-time Processing**: Immediate feedback on upload status
