import BigNumber from "bignumber.js"
import numberToBN from "number-to-bn"

const COEFFICIENT_OF_FRICTION = 1.005

export function integerToDecimal(integer, unit) {
	if (new BigNumber(integer).isNaN()) {
		return null
	}
	return new BigNumber(integer).shiftedBy(-unit).toString()
}

export function decimalToInteger(decimal, unit) {
	if (new BigNumber(decimal).isNaN()) {
		return null
	}
	return numberToBN(new BigNumber(decimal).shiftedBy(unit).dp(0)).toString()
}

async function priceE18(symbol) {
	try {
		const fTokenContract = flamincome.__get_vault_by_symbol__(symbol)
		const totalSupply = await fTokenContract.methods.totalSupply().call()
		if (totalSupply <= 0) return new BigNumber((1e18).toString())
		return await fTokenContract.methods.priceE18().call()
	} catch (error) {
		console.error(error)
		return new BigNumber((1e18).toString()).toString()
	}
}

async function overfillE18(symbol) {
	try {
		const nTokenContract = flamincome.__get_normalizer_by_symbol__(symbol)
		return await nTokenContract.methods.overfillE18().call()
	} catch (error) {
		return 0
	}
}

export async function depositFTokenCalculate({ amount, symbol, decimals }) {
	try {
		const fTokenHash = flamincome.__registry__.vault[symbol]
		const nTokenHash = flamincome.__registry__.normalizer[symbol]
		const nTokenContract = flamincome.__get_normalizer_by_symbol__(symbol)
		const accountAddress = flamincome.__account__
		let f = nTokenContract.methods.f(accountAddress).call()
		let n = nTokenContract.methods.n(accountAddress).call()
		let price18 = priceE18(symbol)
		let overfill18 = overfillE18(symbol)
		await new Promise((res) => {
			Promise.all([f, n, price18, overfill18]).then((vals) => {
				f = vals[0]
				n = vals[1]
				price18 = vals[2]
				overfill18 = vals[3]
				res()
			})
		})

		amount = amount.toString()
		const amountNum = new BigNumber(amount)
		const str10pow18 = (1e18).toString()
		const left = amountNum
			.plus(new BigNumber(f))
			.multipliedBy(new BigNumber(price18))
			.div(new BigNumber(str10pow18))
			.div(new BigNumber(COEFFICIENT_OF_FRICTION))
		const right = new BigNumber(str10pow18)
			.minus(new BigNumber(overfill18))
			.div(new BigNumber(str10pow18))
		let finall = left
			.multipliedBy(right)
			.minus(new BigNumber(n))
			.integerValue(1)
		finall = BigNumber.maximum(finall, 0)
		return new BigNumber(
			integerToDecimal(finall.toFixed(decimals), decimals)
		).toFixed(decimals, 1)
	} catch (error) {
		return 0
	}
}
