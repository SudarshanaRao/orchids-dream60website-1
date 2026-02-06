# Bulk Email & SMS Variable Input Enhancement

## Requirements

1. **Email Management - Variable Input Mode Selection**
   - When sending bulk emails to multiple users, ask whether to input variables "one time" (same for all) or "multiple times" (per-user)
   - If "one time" is selected, show a single input form and apply the same values to all recipients
   - If "multiple times" is selected, show a spreadsheet/table view where each row is a user
   - Show a preview of the final message for the first user before sending

2. **SMS Management - Star (*) Placeholder Variables**
   - When selecting an SMS template with `*` placeholders, auto-replace the first star after "Dear" with the username
   - For remaining stars, show position-based labels (e.g., "Variable 1", "Variable 2") and prompt for values
   - Show a preview of the final message for the first user before sending

## Current Architecture

### Email Management (`src/components/AdminEmailManagement.tsx`)
- Uses `{{variable}}` syntax for placeholders
- `extractTemplateVariables()` extracts variables from subject/body
- `buildUserVariables()` creates per-user variable maps (auto-fills `username`)
- `handleSendEmails()` detects variables and shows a modal for input
- Current modal shows per-user inputs in a vertical list format

### SMS Management (`src/components/AdminSMSManagement.tsx`)
- Uses `*` as placeholders in SMS templates from SMSCountry
- `getPreviewMessage()` generates preview text
- `handleSendSms()` sends to selected users
- `handleSendBulk()` sends to all users in a filter category
- No current variable extraction or prompt for `*` placeholders

## Implementation Phases

### Phase 1: Email Management - Variable Mode Selection
**File: `src/components/AdminEmailManagement.tsx`**

1. Add new state variables:
   - `variableInputMode: 'one-time' | 'per-user' | null` - tracks selected mode
   - `sharedVariables: Record<string, string>` - stores one-time values
   - `showModeSelectionModal: boolean` - controls mode selection popup

2. Create Mode Selection Modal:
   - Display when variables are detected and more than 1 user is selected
   - Two options: "Same values for all users" and "Different values per user"
   - Include brief descriptions for each option

3. Modify `handleSendEmails()`:
   - After detecting variables and multiple users, show mode selection first
   - If "one-time" selected, show single input form then apply to all
   - If "per-user" selected, show existing spreadsheet-style modal

4. Create One-Time Variables Form:
   - Simple vertical form with one input per variable
   - Apply button that copies values to all users in `userVariables`

5. Enhance Spreadsheet View (existing modal):
   - Convert vertical list to horizontal table layout
   - Columns: Username, Email, then one column per variable
   - Sticky header row for variable names
   - Add "Copy first row to all" button

6. Add Preview Section:
   - Show rendered preview for first user before send confirmation
   - Display subject and body with variables replaced
   - Highlight substituted values

### Phase 2: SMS Management - Star Placeholder Variables
**File: `src/components/AdminSMSManagement.tsx`**

1. Add new state variables:
   - `smsVariables: { position: number; label: string; value: string }[]` - extracted star positions
   - `showSmsVariablesModal: boolean` - controls variable input popup
   - `smsPreviewMessage: string` - stores rendered preview

2. Create `extractStarVariables(template: string)`:
   - Parse template for `*` positions
   - First star after "Dear " is auto-labeled "Username" (auto-filled)
   - Remaining stars get position-based labels: "Variable 1", "Variable 2", etc.
   - Return array of `{ position, label, isUsername }` objects

3. Create SMS Variables Modal:
   - Show position-based labels (e.g., "Variable 1 (position 2)")
   - Skip username field (auto-filled)
   - Input fields for each remaining variable
   - Preview section showing first user's final message

4. Create `renderSmsPreview(template, variables, username)`:
   - Replace stars in order with provided values
   - First star after "Dear" gets username
   - Return rendered string

5. Modify `handleSendSms()`:
   - Before sending, check if template has `*` placeholders
   - If yes, show variables modal first
   - Apply variables to each user (replacing `*` placeholders)

6. Modify Send Logic:
   - For each user, generate personalized message
   - Replace first "Dear *" with "Dear {username}"
   - Replace remaining `*` with entered variable values

### Phase 3: Preview Enhancement (Both Email & SMS)
1. Add preview toggle/section in both modals
2. Show sample output for first selected user
3. Highlight variable substitutions with different styling
4. Allow switching preview between users (optional enhancement)

## Technical Details

### Email Variable Modes - State Flow
```
handleSendEmails clicked
  └─> Variables detected?
      └─> No: Send directly
      └─> Yes: Multiple users selected?
          └─> No: Show per-user modal (existing)
          └─> Yes: Show mode selection modal
              └─> "One-time" selected: Show shared input form
                  └─> Submit: Apply to all users, show preview, send
              └─> "Per-user" selected: Show spreadsheet modal
                  └─> Submit: Show preview, send
```

### SMS Star Extraction Logic
```typescript
function extractStarVariables(template: string) {
  const variables = [];
  let position = 0;
  let dearFound = false;
  
  // Find all * positions
  const regex = /\*/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    position++;
    const beforeStar = template.substring(0, match.index).toLowerCase();
    const isAfterDear = !dearFound && beforeStar.endsWith('dear ');
    
    variables.push({
      position,
      index: match.index,
      label: isAfterDear ? 'Username' : `Variable ${position}`,
      isUsername: isAfterDear,
      value: ''
    });
    
    if (isAfterDear) dearFound = true;
  }
  
  return variables;
}
```

### UI Components to Add

**Email Mode Selection Modal:**
- Card-style selection with icons
- "One-time" option with Users icon
- "Per-user" option with Table icon
- Cancel button to go back

**Email Spreadsheet Table:**
- Horizontal scroll for many variables
- Sticky first column (username)
- Alternating row colors
- "Fill down" button for each column

**SMS Variables Modal:**
- Variable label with position indicator
- Input field with placeholder showing variable context
- Live preview updating as values change

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Large user lists causing slow rendering | Virtual scrolling for 100+ users in spreadsheet view |
| SMS character limit exceeded after variable substitution | Show character count warning if preview > 160 chars |
| Template syntax varies (some use `{var}` vs `*`) | Support both patterns in extraction logic |

## Dependencies
- No new external libraries required
- Uses existing Lucide icons (Table2, Copy, Eye)
- Builds on existing modal/form patterns in codebase

## Testing Checklist
- [ ] Email: Select 1 user with variables - should show existing per-user modal
- [ ] Email: Select 5 users, choose "one-time" - values apply to all
- [ ] Email: Select 5 users, choose "per-user" - spreadsheet shows correctly
- [ ] Email: Preview shows first user's personalized content
- [ ] SMS: Template with "Dear *" auto-fills username
- [ ] SMS: Template with multiple `*` shows position labels
- [ ] SMS: Preview shows correct substitution
- [ ] SMS: Sent messages have correct personalized content
