
/*
 * GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: 'Applications' });
};

exports.newSchedule = function(req, res){
	res.render('newSchedule', {title: 'Amortization Schedule Calculator'});
};

exports.calcSchedule = function(req, res){
	console.log(req.body);
	var loa = new Loan(req.body.loanAmount, req.body.loanInterest, req.body.loanTerm);
	// console.log(loa);
	var lst = schedule(loa);
	// console.log("length"+ lst.length);
	res.render('calcSchedule', {title: 'Amortization Schedule', loaninput:loa, schedulelst:lst});
};

function Loan(amount, interest, term) {
  this.amount = amount;
  this.interest = interest;
  this.term = term;
}

Loan.prototype.getAmount = function getAmount() {
  return this.amount;
};

Loan.prototype.getInterest = function getInterest() {
  return this.interest;
};

Loan.prototype.toString = function toString() {
  return this.constructor.name + " a=" + this.getAmount() + " p=" + this.getInterest();
};

var amountBorrowed = 0; // in cents
var apr = 0;//annual percentage rate
var initialTermMonths = 0;

var monthlyInterestDivisor = 12 * 100;
var monthlyInterest = 0;
var monthlyPaymentAmount = 0; // in cents

function Amortization(paymentnumber, paymentamount, paymentinterest, currentbalance, totalpayments, totalinterestpaid) {
  this.paymentnumber = paymentnumber;
  this.paymentamount = paymentamount;
  this.paymentinterest = paymentinterest;
  this.currentbalance = currentbalance;
  this.totalpayments = totalpayments;
  this.totalinterestpaid = totalinterestpaid;
 } 

function calculateMonthlyPayment(loan)
{
		amountBorrowed = Math.round(loan.amount * 100);
		apr = loan.interest;
		initialTermMonths = loan.term * 12;
	// calculate J
		monthlyInterest = apr / monthlyInterestDivisor;

		// this is 1 / (1 + J)
		var tmp = Math.pow(1 + monthlyInterest, -1);

		// this is Math.pow(1/(1 + J), N)
		tmp = Math.pow(tmp, initialTermMonths);

		// this is 1 / (1 - (Math.pow(1/(1 + J), N))))
		tmp = Math.pow(1 - tmp, -1);

		// M = P * (J / (1 - (Math.pow(1/(1 + J), N))));
		var rc = amountBorrowed * monthlyInterest * tmp;

		return Math.round(rc);
};

function schedule(ln)
{
		monthlyPaymentAmount = calculateMonthlyPayment(ln);

		var balance = amountBorrowed;
		var paymentNumber = 0;
		var totalPayments = 0;
		var totalInterestPaid = 0;

		var i = 0;
		var list = new Array();
		var a = new Amortization(paymentNumber++, 0, 0, amountBorrowed/100, totalPayments/100, totalInterestPaid/100);
		list.push(a);

		var maxNumberOfPayments = initialTermMonths + 1;
		while ((balance > 0) && (paymentNumber <= maxNumberOfPayments))
		{
			// Calculate H = P x J, this is your current monthly interest
			var curMonthlyInterest = Math.round((balance) * monthlyInterest);

			// the amount required to payoff the loan
			var curPayoffAmount = balance + curMonthlyInterest;

			// the amount to payoff the remaining balance may be less than the
			// calculated monthlyPaymentAmount
			var curMonthlyPaymentAmount = Math.min(monthlyPaymentAmount, curPayoffAmount);

			// it's possible that the calculated monthlyPaymentAmount is 0,
			// or the monthly payment only covers the interest payment - i.e. no
			// principal
			// so the last payment needs to payoff the loan
			if ((paymentNumber == maxNumberOfPayments)
					&& ((curMonthlyPaymentAmount == 0) || (curMonthlyPaymentAmount == curMonthlyInterest)))
			{
				curMonthlyPaymentAmount = curPayoffAmount;
			}

			// Calculate C = M - H, this is your monthly payment minus your
			// monthly interest,
			// so it is the amount of principal you pay for that month
			var curMonthlyPrincipalPaid = curMonthlyPaymentAmount - curMonthlyInterest;

			// Calculate Q = P - C, this is the new balance of your principal of
			// your loan.
			var curBalance = balance - curMonthlyPrincipalPaid;

			totalPayments += curMonthlyPaymentAmount;
			totalInterestPaid += curMonthlyInterest;

			var b = new Amortization(paymentNumber++, curMonthlyPaymentAmount/100, curMonthlyInterest/100, curBalance/100, totalPayments/100, totalInterestPaid/100);
			list.push(b);
	
			// Set P equal to Q and go back to Step 1: You thusly loop around
			// until the value Q (and hence P) goes to zero.
			balance = curBalance;
		}
		return list;
};