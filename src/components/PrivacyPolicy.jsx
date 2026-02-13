import React from 'react';
import Footer from './Footer';
import '../styles/PolicyPages.css';

const PrivacyPolicy = () => {
    return (
        <div className="page-container">
            <main className="policy-content">
                <h1>Privacy Policy</h1>
                <p>Last updated: January 28, 2026</p>

                <p>At Notemee, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Notemee and how we use it.</p>

                <h2>Log Files</h2>
                <p>Notemee follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>

                <h2>Google DoubleClick DART Cookie</h2>
                <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</p>

                <h2>Privacy Policies</h2>
                <p>You may consult this list to find the Privacy Policy for each of the advertising partners of Notemee.</p>

                <h2>Third Party Privacy Policies</h2>
                <p>Notemee's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.</p>

                <h2>Consent</h2>
                <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
