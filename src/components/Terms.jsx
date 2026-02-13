import React from 'react';
import Footer from './Footer';
import '../styles/PolicyPages.css';

const Terms = () => {
    return (
        <div className="page-container">
            <main className="policy-content">
                <h1>Terms & Conditions</h1>
                <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Notemee if you do not agree to take all of the terms and conditions stated on this page.</p>

                <h2>Cookies</h2>
                <p>We employ the use of cookies. By accessing Notemee, you agreed to use cookies in agreement with the Notemee's Privacy Policy.</p>

                <h2>License</h2>
                <p>Unless otherwise stated, Notemee and/or its licensors own the intellectual property rights for all material on Notemee. All intellectual property rights are reserved.</p>

                <h2>User Responsibilities</h2>
                <p>Users are responsible for maintaining the confidentiality of their account and password. Notemee shall not be responsible for any loss or damage arising from your failure to comply with this security obligation.</p>

                <h2>Hyperlinking to our Content</h2>
                <p>The following organizations may link to our Website without prior written approval: Government agencies; Search engines; News organizations.</p>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
