# Manual Testing Guide for Production Readiness

## 🧪 **Comprehensive Manual Testing Checklist**

This guide provides step-by-step instructions for manually testing the DID + SBT Dashboard to verify production readiness.

---

## **1. WALLET CONNECTION TESTING**

### **MetaMask Testing**
```bash
# Start the application
npm start
```

**Test Steps:**
1. **Open the application** in Chrome/Firefox
2. **Click "Login with Ethereum"**
3. **Verify MetaMask detection** - should show MetaMask as available
4. **Click MetaMask** - should prompt for connection
5. **Approve connection** in MetaMask popup
6. **Select account** from the account list
7. **Verify connection** - should show account details
8. **Test DID creation** - should proceed to DID wizard

**Expected Results:**
- ✅ MetaMask detected automatically
- ✅ Connection prompt appears
- ✅ Account selection works
- ✅ DID creation flow starts
- ✅ No console errors

### **Polkadot.js Testing**
```bash
# Ensure Polkadot.js extension is installed
# Available from: https://polkadot.js.org/extension/
```

**Test Steps:**
1. **Click "Login with Polkadot"**
2. **Verify Polkadot.js detection** - should show as available
3. **Click Polkadot.js Extension**
4. **Approve connection** in extension popup
5. **Select account** from the list
6. **Verify connection** - should show account details
7. **Test DID creation** - should proceed to DID wizard

**Expected Results:**
- ✅ Polkadot.js detected automatically
- ✅ Connection prompt appears
- ✅ Account selection works
- ✅ DID creation flow starts
- ✅ No console errors

---

## **2. DID CREATION FLOW TESTING**

### **Basic DID Creation**
**Test Steps:**
1. **Start DID creation** after wallet connection
2. **Select "Basic DID"** option
3. **Click "Next"** to preview
4. **Verify preview** shows correct DID format
5. **Click "Next"** to creation step
6. **Click "Create My DID"**
7. **Wait for completion** (should show loading)
8. **Verify success** - should show DID in profile

**Expected Results:**
- ✅ Basic DID option selected
- ✅ Preview shows valid DID document
- ✅ Creation completes successfully
- ✅ DID appears in profile section
- ✅ DID Document Viewer shows details

### **Advanced DID Creation**
**Test Steps:**
1. **Start DID creation** after wallet connection
2. **Select "Advanced DID"** option
3. **Add custom attributes**:
   - Key: "role", Value: "developer"
   - Key: "organization", Value: "KeyPass"
4. **Set purpose** to "professional"
5. **Add description** "Professional identity for blockchain development"
6. **Click "Next"** to preview
7. **Verify preview** shows advanced features
8. **Complete creation** and verify in profile

**Expected Results:**
- ✅ Advanced DID option selected
- ✅ Custom attributes added successfully
- ✅ Preview shows advanced DID document
- ✅ Creation completes successfully
- ✅ Advanced features visible in profile

---

## **3. SBT DISPLAY TESTING**

### **SBT Data Loading**
**Test Steps:**
1. **Complete authentication** and DID creation
2. **Navigate to SBT section** in profile
3. **Test different data sources**:
   - Click "Demo Data" - should show mock SBTs
   - Click "Test Mode" - should show simulated real data
   - Click "Real Data" - should attempt real blockchain calls
4. **Verify SBT cards** display correctly
5. **Test pagination** if multiple tokens
6. **Click on SBT cards** - should show details

**Expected Results:**
- ✅ SBT section loads without errors
- ✅ Different data sources work
- ✅ SBT cards display with images and metadata
- ✅ Pagination works correctly
- ✅ Card interactions work
- ✅ Loading states display properly

### **SBT Card Interactions**
**Test Steps:**
1. **Hover over SBT cards** - should show hover effects
2. **Click on SBT cards** - should show detailed modal
3. **Verify token details**:
   - Token name and description
   - Issuer information
   - Issuance and expiration dates
   - Verification status
   - Blockchain details
4. **Test expired/revoked tokens** - should show appropriate styling

**Expected Results:**
- ✅ Hover effects work smoothly
- ✅ Click interactions respond
- ✅ Token details display correctly
- ✅ Status indicators work
- ✅ Expired/revoked styling applied

---

## **4. CREDENTIAL MANAGEMENT TESTING**

### **Credential Display**
**Test Steps:**
1. **Navigate to Credentials section** in profile
2. **Verify credential tabs**:
   - Credentials tab
   - Requests tab
   - Offers tab
   - ZK-Proofs tab
3. **Check credential cards** display correctly
4. **Test credential interactions**:
   - Share credential
   - View details
   - Revoke credential (if applicable)

**Expected Results:**
- ✅ All credential tabs load
- ✅ Credential cards display properly
- ✅ Interactions work correctly
- ✅ Status indicators show correctly

### **Credential Request Flow**
**Test Steps:**
1. **Click "Request Credential"** button
2. **Fill out request form**:
   - Select credential type
   - Add required claims
   - Set privacy requirements
3. **Submit request** and verify creation
4. **Check requests tab** for new request
5. **Verify request status** updates

**Expected Results:**
- ✅ Request wizard opens
- ✅ Form validation works
- ✅ Request submission succeeds
- ✅ Request appears in requests tab
- ✅ Status updates correctly

---

## **5. ERROR HANDLING TESTING**

### **Network Failure Scenarios**
**Test Steps:**
1. **Disconnect internet** during wallet connection
2. **Verify error message** appears
3. **Reconnect internet** and retry
4. **Test API failure** scenarios
5. **Verify fallback mechanisms** work

**Expected Results:**
- ✅ Error messages display clearly
- ✅ Retry mechanisms work
- ✅ No application crashes
- ✅ User can recover from errors

### **Wallet Disconnection**
**Test Steps:**
1. **Connect wallet** successfully
2. **Disconnect wallet** from browser extension
3. **Verify application** detects disconnection
4. **Test reconnection** flow
5. **Verify state** updates correctly

**Expected Results:**
- ✅ Disconnection detected
- ✅ Appropriate message shown
- ✅ Reconnection flow works
- ✅ State updates properly

---

## **6. MOBILE RESPONSIVENESS TESTING**

### **Mobile Browser Testing**
**Test Steps:**
1. **Open application** on mobile browser
2. **Test wallet connection** on mobile
3. **Verify responsive design**:
   - Text readable on small screens
   - Buttons appropriately sized
   - Navigation works on touch
4. **Test DID creation** on mobile
5. **Verify SBT display** on mobile

**Expected Results:**
- ✅ Application loads on mobile
- ✅ Wallet connection works
- ✅ UI elements properly sized
- ✅ Touch interactions work
- ✅ No horizontal scrolling

### **Tablet Testing**
**Test Steps:**
1. **Test on tablet** device
2. **Verify layout** adapts correctly
3. **Test all interactions** work
4. **Verify performance** is acceptable

**Expected Results:**
- ✅ Layout adapts to tablet
- ✅ All features work
- ✅ Performance acceptable

---

## **7. PERFORMANCE TESTING**

### **Load Time Testing**
**Test Steps:**
1. **Open browser dev tools**
2. **Go to Network tab**
3. **Reload application** and measure:
   - Initial load time
   - Time to interactive
   - Bundle size
4. **Test with slow connection** (3G simulation)
5. **Verify acceptable performance**

**Expected Results:**
- ✅ Initial load < 3 seconds
- ✅ Time to interactive < 5 seconds
- ✅ Bundle size < 2MB
- ✅ Works on slow connections

### **Memory Usage Testing**
**Test Steps:**
1. **Open browser dev tools**
2. **Go to Performance tab**
3. **Record performance** during:
   - Wallet connection
   - DID creation
   - SBT loading
4. **Check for memory leaks**
5. **Verify stable performance**

**Expected Results:**
- ✅ No memory leaks
- ✅ Stable performance
- ✅ No excessive CPU usage

---

## **8. SECURITY TESTING**

### **Input Validation Testing**
**Test Steps:**
1. **Try invalid inputs** in forms:
   - Empty fields
   - Special characters
   - Very long inputs
   - SQL injection attempts
2. **Verify validation** catches issues
3. **Test XSS prevention**
4. **Verify no sensitive data** in console

**Expected Results:**
- ✅ Invalid inputs rejected
- ✅ No XSS vulnerabilities
- ✅ No sensitive data exposed
- ✅ Proper error messages

### **Wallet Security Testing**
**Test Steps:**
1. **Verify no private keys** stored in localStorage
2. **Test signature verification** works correctly
3. **Verify DID creation** is secure
4. **Test credential handling** is secure

**Expected Results:**
- ✅ No private keys exposed
- ✅ Signatures verified correctly
- ✅ DID creation secure
- ✅ Credentials handled securely

---

## **9. ACCESSIBILITY TESTING**

### **Screen Reader Testing**
**Test Steps:**
1. **Enable screen reader** (NVDA, JAWS, VoiceOver)
2. **Navigate application** using screen reader
3. **Verify all elements** are accessible
4. **Test keyboard navigation**
5. **Verify ARIA labels** present

**Expected Results:**
- ✅ All elements accessible
- ✅ Keyboard navigation works
- ✅ ARIA labels present
- ✅ Screen reader friendly

### **Color Contrast Testing**
**Test Steps:**
1. **Use browser dev tools** to check contrast
2. **Verify text** meets WCAG standards
3. **Test with color blindness** simulation
4. **Verify all text** readable

**Expected Results:**
- ✅ Contrast meets WCAG AA
- ✅ Text readable for color blind users
- ✅ No color-only indicators

---

## **10. BROWSER COMPATIBILITY TESTING**

### **Cross-Browser Testing**
**Test Steps:**
1. **Test on Chrome** (latest version)
2. **Test on Firefox** (latest version)
3. **Test on Safari** (latest version)
4. **Test on Edge** (latest version)
5. **Verify consistent behavior**

**Expected Results:**
- ✅ Works on all major browsers
- ✅ Consistent behavior across browsers
- ✅ No browser-specific issues

---

## **📊 TESTING CHECKLIST**

### **Critical Path Testing**
- [ ] Wallet connection (MetaMask)
- [ ] Wallet connection (Polkadot.js)
- [ ] DID creation (Basic)
- [ ] DID creation (Advanced)
- [ ] SBT display and interaction
- [ ] Credential management
- [ ] Error handling
- [ ] Mobile responsiveness

### **Security Testing**
- [ ] Input validation
- [ ] XSS prevention
- [ ] Private key security
- [ ] Signature verification
- [ ] Data handling security

### **Performance Testing**
- [ ] Load time measurement
- [ ] Memory usage monitoring
- [ ] Mobile performance
- [ ] Network failure handling

### **Accessibility Testing**
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast
- [ ] ARIA labels

---

## **🎯 SUCCESS CRITERIA**

### **All tests must pass:**
- ✅ No critical errors
- ✅ All features functional
- ✅ Security requirements met
- ✅ Performance acceptable
- ✅ Accessibility compliant
- ✅ Cross-browser compatible

### **If any test fails:**
1. **Document the issue** with steps to reproduce
2. **Fix the issue** before proceeding
3. **Re-test** the specific functionality
4. **Verify fix** doesn't break other features

---

## **📝 TESTING LOG TEMPLATE**

```
Date: _______________
Tester: _____________
Browser: ____________
Device: _____________

### Test Results:
- [ ] Wallet Connection: PASS/FAIL
- [ ] DID Creation: PASS/FAIL
- [ ] SBT Display: PASS/FAIL
- [ ] Credential Management: PASS/FAIL
- [ ] Error Handling: PASS/FAIL
- [ ] Mobile Responsiveness: PASS/FAIL
- [ ] Security: PASS/FAIL
- [ ] Performance: PASS/FAIL
- [ ] Accessibility: PASS/FAIL

### Issues Found:
1. ________________
2. ________________
3. ________________

### Recommendations:
1. ________________
2. ________________
3. ________________

Overall Assessment: PRODUCTION READY / NEEDS WORK / NOT READY
```

---

**Use this guide systematically to verify production readiness. Each test should be performed thoroughly and documented. Only proceed to production when all critical tests pass.** 