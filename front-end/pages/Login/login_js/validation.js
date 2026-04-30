/**
 * Global Form Validation for EventPro
 * Handles robust validation for Email, Phone, Password and Names.
 */

document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');

    const patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
        phone: /^[1-9][0-9]{9}$/,
        name: /^[A-Za-z\s]{2,}$/
    };

    function isGmailValid(email) {
        const emailLower = email.toLowerCase();
        if (!emailLower.endsWith('@gmail.com')) return { valid: true };

        const localPart = emailLower.split('@')[0];

        if (localPart.length < 6 || localPart.length > 30) {
            return { valid: false, message: 'Gmail local part must be between 6 and 30 characters.' };
        }
        if (!/^[a-z0-9.]+$/i.test(localPart)) {
            return { valid: false, message: 'Gmail only allows letters (a-z), numbers (0-9), and periods (.).' };
        }
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            return { valid: false, message: 'Gmail local part cannot start or end with a period.' };
        }
        if (localPart.includes('..')) {
            return { valid: false, message: 'Gmail does not allow consecutive periods.' };
        }

        return { valid: true };
    }

    function isPhoneValid(phone) {
        if (!/^[0-9]{10}$/.test(phone)) {
            return { valid: false, message: 'Phone number must be exactly 10 digits.' };
        }
        if (phone.startsWith('0')) {
            return { valid: false, message: 'Phone number cannot start with 0.' };
        }
        if (/^(\d)\1{9}$/.test(phone)) {
            return { valid: false, message: 'Invalid phone number (all digits cannot be the same).' };
        }

        return { valid: true };
    }

    function getInputType(input) {
        const typeAttr = (input.getAttribute('type') || '').toLowerCase();
        const nameAttr = (input.getAttribute('name') || '').toLowerCase();
        const idAttr = (input.getAttribute('id') || '').toLowerCase();

        if (typeAttr === 'email' || nameAttr.includes('email') || idAttr.includes('email')) return 'email';
        if (typeAttr === 'password' || nameAttr.includes('password') || idAttr.includes('password')) return 'password';
        if (typeAttr === 'tel' || nameAttr.includes('phone') || idAttr.includes('phone') || idAttr.includes('contact') || nameAttr.includes('number')) return 'phone';
        if (nameAttr.includes('name') || idAttr.includes('name') || nameAttr === 'fname' || nameAttr === 'lname' || nameAttr === 'first_name' || nameAttr === 'last_name') return 'name';

        return null;
    }

    function getErrorMessage(type, value) {
        switch (type) {
            case 'email':
                const gmailCheck = isGmailValid(value);
                if (!gmailCheck.valid) return gmailCheck.message;
                return 'Please enter a valid email address.';
            case 'password':
                return 'Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (@$!%*?&).';
            case 'phone':
                const phoneCheck = isPhoneValid(value);
                if (!phoneCheck.valid) return phoneCheck.message;
                return 'Phone number must be 10 digits and not all identical.';
            case 'name':
                return 'Name must contain only alphabetic characters (min 2).';
            default:
                return 'This field is required.';
        }
    }

    function validateInput(input) {
        if (input.type === 'submit' || input.type === 'button' || input.type === 'hidden' || input.type === 'radio' || input.type === 'checkbox') return true;

        let isValid = true;
        let errorMessage = '';
        const value = input.value.trim();
        const isRequired = input.hasAttribute('required') || input.classList.contains('required');

        if (isRequired && value === '') {
            isValid = false;
            errorMessage = 'This field is required.';
        } else if (value !== '') {
            const customType = getInputType(input);
            if (customType) {
                if (customType === 'email') {
                    if (!patterns.email.test(value)) {
                        isValid = false;
                        errorMessage = getErrorMessage('email', value);
                    } else {
                        const gmailCheck = isGmailValid(value);
                        if (!gmailCheck.valid) {
                            isValid = false;
                            errorMessage = gmailCheck.message;
                        }
                    }
                } else if (customType === 'phone') {
                    const phoneCheck = isPhoneValid(value);
                    if (!phoneCheck.valid) {
                        isValid = false;
                        errorMessage = phoneCheck.message;
                    }
                } else if (patterns[customType]) {
                    if (!patterns[customType].test(value)) {
                        isValid = false;
                        errorMessage = getErrorMessage(customType, value);
                    }
                }
            }
        }

        showError(input, isValid, errorMessage);
        return isValid;
    }

    function showError(input, isValid, message) {
        let errorSpan = input.parentNode.querySelector('.v-error-msg');
        if (!errorSpan) {
            errorSpan = document.createElement('div');
            errorSpan.className = 'v-error-msg';
            errorSpan.style.color = '#ff4d4f';
            errorSpan.style.fontSize = '12px';
            errorSpan.style.marginTop = '4px';
            errorSpan.style.display = 'none';
            // Insert after input element
            input.parentNode.insertBefore(errorSpan, input.nextSibling);
        }

        if (!isValid) {
            input.style.border = '1px solid #ff4d4f';
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
        } else {
            if (input.value.trim() !== '') {
                input.style.border = '1px solid #4ade80';
            } else {
                input.style.border = '';
            }
            errorSpan.style.display = 'none';
        }
    }

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');

        inputs.forEach(input => {
            input.addEventListener('input', () => validateInput(input));
            input.addEventListener('blur', () => validateInput(input));
        });

        form.addEventListener('submit', (e) => {
            let formValid = true;
            inputs.forEach(input => {
                const isValid = validateInput(input);
                if (!isValid) formValid = false;
            });

            if (!formValid) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Intercept validation from other scripts (like script.js btn-continue)
        const continueBtns = form.querySelectorAll('.btn-continue, .btn-submit');
        continueBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                let formValid = true;
                inputs.forEach(input => {
                    const isValid = validateInput(input);
                    if (!isValid) formValid = false;
                });

                if (!formValid) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true); // Capturing phase to catch it before other listeners
        });
    });
});
