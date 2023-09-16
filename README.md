This is part of the **Coin Iran** Solidity & Blockchain Course.
Based on _Patrick Collins fundMe project_

## Getting Started

1. Go to [Backend](./backend/) to access backend part
2. Go to [frontend](./frontend/) to access frontend part
2. To watch the project's description video, click here > [ِWatch](https://mega.nz/file/Yr02mSLa#bQNgCIjuT6kyvRA4iUtgZj1lvlCQy0A5U3E5WWjAFyI)


# Refund function
I added the refund function to the FundMe project. 
The refund function provided is a Solidity smart contract function that refunds a specified amount of Ether to a user's address. The function takes in two parameters: the user's address and the amount to be refunded. It first checks that the user's address is not undefined and that the user has sent money to the contract before. Then, it calculates the net amount funded by the user and checks that the refund amount is less than or equal to the net amount funded. It also calculates the gas cost for the transfer and checks that the contract has enough funds to refund the specified amount plus the gas cost. Finally, it subtracts the refund amount from the user's total amount funded, transfers the refund amount minus the gas cost to the user's address, and emits an event indicating that the refund was successful

# Thank you!"
